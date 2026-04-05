const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");

// In-memory state for active users
const users = new Map(); // socketId -> { id, username, color, x, y }
const games = new Map(); // gameId -> { id, type, players, state, turn, winner }
const PROXIMITY_RADIUS = 150; // pixels

function getDistance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getChatRoomId(id1, id2) {
  return [id1, id2].sort().join(":");
}

function getRandomColor() {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomSpawn() {
  return {
    x: 200 + Math.random() * 600,
    y: 200 + Math.random() * 400,
  };
}

function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining
    socket.on("join", async (data) => {
      const spawn = getRandomSpawn();
      const userData = {
        id: socket.id,
        username: data.username || `User-${socket.id.slice(0, 4)}`,
        color: getRandomColor(),
        x: spawn.x,
        y: spawn.y,
        connections: [],
      };

      users.set(socket.id, userData);

      // Try to persist to MongoDB
      try {
        await User.findOneAndUpdate(
          { username: userData.username },
          {
            username: userData.username,
            color: userData.color,
            lastPosition: { x: userData.x, y: userData.y },
            lastSeen: new Date(),
          },
          { upsert: true }
        );
      } catch {
        // MongoDB not available, continue with in-memory
      }

      // Send current user their data
      socket.emit("joined", userData);

      // Send existing users to the new user
      const existingUsers = Array.from(users.values()).filter(
        (u) => u.id !== socket.id
      );
      socket.emit("existingUsers", existingUsers);

      // Broadcast new user to others
      socket.broadcast.emit("userJoined", userData);
    });

    // Handle movement
    socket.on("move", (data) => {
      const user = users.get(socket.id);
      if (!user) return;

      user.x = data.x;
      user.y = data.y;

      // Broadcast position to all other users
      socket.broadcast.emit("userMoved", {
        id: socket.id,
        x: data.x,
        y: data.y,
      });

      // Check proximity with all other users
      checkProximity(io, socket, user);
    });

    // Handle chat messages
    socket.on("chatMessage", async (data) => {
      const user = users.get(socket.id);
      if (!user) return;

      const { targetId, message } = data;
      const roomId = getChatRoomId(socket.id, targetId);

      const chatMsg = {
        roomId,
        senderId: socket.id,
        senderName: user.username,
        message,
        timestamp: new Date().toISOString(),
      };

      // Try to persist
      try {
        await ChatMessage.create(chatMsg);
      } catch {
        // continue without persistence
      }

      // Send to both users in the room
      io.to(socket.id).emit("newMessage", chatMsg);
      io.to(targetId).emit("newMessage", chatMsg);
    });

    // ===== GAME EVENTS =====

    // Send game invite
    socket.on("gameInvite", ({ targetId, gameType }) => {
      const user = users.get(socket.id);
      if (!user) return;
      io.to(targetId).emit("gameInvite", {
        fromId: socket.id,
        fromName: user.username,
        fromColor: user.color,
        gameType,
      });
    });

    // Accept game invite → create game and notify both
    socket.on("gameAccept", ({ fromId, gameType }) => {
      const user = users.get(socket.id);
      const opponent = users.get(fromId);
      if (!user || !opponent) return;

      const gameId = [socket.id, fromId].sort().join(":") + ":" + gameType;
      const game = createGame(gameId, gameType, socket.id, fromId);
      games.set(gameId, game);

      const payload = {
        gameId,
        gameType,
        players: {
          [socket.id]: { id: socket.id, username: user.username, color: user.color },
          [fromId]: { id: fromId, username: opponent.username, color: opponent.color },
        },
        state: game.state,
        turn: game.turn,
      };

      io.to(socket.id).emit("gameStart", payload);
      io.to(fromId).emit("gameStart", payload);
    });

    // Decline game invite
    socket.on("gameDecline", ({ fromId }) => {
      const user = users.get(socket.id);
      if (!user) return;
      io.to(fromId).emit("gameDeclined", {
        byName: user.username,
      });
    });

    // Game move
    socket.on("gameMove", ({ gameId, move }) => {
      const game = games.get(gameId);
      if (!game) return;

      const result = processMove(game, socket.id, move);
      if (!result) return; // invalid move

      const payload = {
        gameId,
        state: game.state,
        turn: game.turn,
        winner: game.winner,
        lastMove: { playerId: socket.id, move },
      };

      for (const pid of game.players) {
        io.to(pid).emit("gameUpdate", payload);
      }

      // Clean up finished games after a delay
      if (game.winner) {
        setTimeout(() => games.delete(gameId), 60000);
      }
    });

    // Leave / close game
    socket.on("gameLeave", ({ gameId }) => {
      const game = games.get(gameId);
      if (!game) return;
      for (const pid of game.players) {
        io.to(pid).emit("gameEnded", { gameId, reason: "left" });
      }
      games.delete(gameId);
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      const user = users.get(socket.id);
      if (user) {
        // Notify connected users about disconnection
        if (user.connections) {
          for (const connId of user.connections) {
            const otherUser = users.get(connId);
            if (otherUser) {
              otherUser.connections = otherUser.connections.filter(
                (id) => id !== socket.id
              );
              io.to(connId).emit("proximityDisconnect", { userId: socket.id });
            }
          }
        }

        // Try to update last seen
        try {
          await User.findOneAndUpdate(
            { username: user.username },
            { lastPosition: { x: user.x, y: user.y }, lastSeen: new Date() }
          );
        } catch {
          // ignore
        }

        // Clean up games this user was in
        for (const [gameId, game] of games) {
          if (game.players.includes(socket.id)) {
            for (const pid of game.players) {
              if (pid !== socket.id) {
                io.to(pid).emit("gameEnded", { gameId, reason: "disconnected" });
              }
            }
            games.delete(gameId);
          }
        }

        users.delete(socket.id);
      }

      io.emit("userLeft", { id: socket.id });
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

function checkProximity(io, socket, user) {
  for (const [otherId, otherUser] of users) {
    if (otherId === socket.id) continue;

    const distance = getDistance(user, otherUser);
    const isConnected = user.connections.includes(otherId);

    if (distance < PROXIMITY_RADIUS && !isConnected) {
      // Connect
      user.connections.push(otherId);
      otherUser.connections.push(socket.id);

      const roomId = getChatRoomId(socket.id, otherId);

      io.to(socket.id).emit("proximityConnect", {
        userId: otherId,
        username: otherUser.username,
        color: otherUser.color,
        roomId,
      });

      io.to(otherId).emit("proximityConnect", {
        userId: socket.id,
        username: user.username,
        color: user.color,
        roomId,
      });
    } else if (distance >= PROXIMITY_RADIUS && isConnected) {
      // Disconnect
      user.connections = user.connections.filter((id) => id !== otherId);
      otherUser.connections = otherUser.connections.filter(
        (id) => id !== socket.id
      );

      io.to(socket.id).emit("proximityDisconnect", { userId: otherId });
      io.to(otherId).emit("proximityDisconnect", { userId: socket.id });
    }
  }
}

// ===== GAME LOGIC =====

function createGame(gameId, type, player1, player2) {
  const base = { id: gameId, type, players: [player1, player2], winner: null };

  if (type === "tictactoe") {
    return {
      ...base,
      state: { board: Array(9).fill(null) },
      turn: player1,
    };
  }

  if (type === "rps") {
    return {
      ...base,
      state: { choices: {}, round: 1, scores: { [player1]: 0, [player2]: 0 } },
      turn: null, // both play simultaneously
    };
  }

  if (type === "memory") {
    // Generate 8 pairs (16 cards)
    const emojis = ["🚀", "⭐", "🎮", "🎵", "🔥", "💎", "🌈", "🍕"];
    const cards = [...emojis, ...emojis]
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5)
      .map((card, i) => ({ ...card, id: i }));

    return {
      ...base,
      state: {
        cards,
        flipped: [],        // currently flipped (max 2)
        scores: { [player1]: 0, [player2]: 0 },
      },
      turn: player1,
    };
  }

  return base;
}

function processMove(game, playerId, move) {
  if (game.winner) return false;

  if (game.type === "tictactoe") {
    return processTicTacToe(game, playerId, move);
  }
  if (game.type === "rps") {
    return processRPS(game, playerId, move);
  }
  if (game.type === "memory") {
    return processMemory(game, playerId, move);
  }
  return false;
}

function processTicTacToe(game, playerId, move) {
  if (game.turn !== playerId) return false;
  const { index } = move;
  if (index < 0 || index > 8 || game.state.board[index] !== null) return false;

  const symbol = game.players[0] === playerId ? "X" : "O";
  game.state.board[index] = symbol;

  // Check winner
  const b = game.state.board;
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6],         // diags
  ];
  for (const [a, bb, c] of lines) {
    if (b[a] && b[a] === b[bb] && b[a] === b[c]) {
      game.winner = playerId;
      return true;
    }
  }
  // Check draw
  if (b.every((cell) => cell !== null)) {
    game.winner = "draw";
    return true;
  }

  // Switch turn
  game.turn = game.players.find((p) => p !== playerId);
  return true;
}

function processRPS(game, playerId, move) {
  const { choice } = move; // "rock", "paper", "scissors"
  if (!["rock", "paper", "scissors"].includes(choice)) return false;

  game.state.choices[playerId] = choice;

  // If both players chose, resolve
  if (Object.keys(game.state.choices).length === 2) {
    const [p1, p2] = game.players;
    const c1 = game.state.choices[p1];
    const c2 = game.state.choices[p2];

    let roundWinner = null;
    if (c1 !== c2) {
      const wins = { rock: "scissors", scissors: "paper", paper: "rock" };
      roundWinner = wins[c1] === c2 ? p1 : p2;
      game.state.scores[roundWinner]++;
    }

    game.state.roundWinner = roundWinner;
    game.state.roundChoices = { [p1]: c1, [p2]: c2 };

    // Best of 5 (first to 3)
    if (game.state.scores[p1] >= 3) {
      game.winner = p1;
    } else if (game.state.scores[p2] >= 3) {
      game.winner = p2;
    } else {
      game.state.round++;
    }

    // Reset choices for next round
    game.state.choices = {};
  }

  return true;
}

function processMemory(game, playerId, move) {
  if (game.turn !== playerId) return false;
  const { cardIndex } = move;
  const { cards, flipped } = game.state;

  if (cardIndex < 0 || cardIndex >= cards.length) return false;
  if (cards[cardIndex].matched || flipped.includes(cardIndex)) return false;

  flipped.push(cardIndex);
  cards[cardIndex].flipped = true;

  if (flipped.length === 2) {
    const [i1, i2] = flipped;
    if (cards[i1].emoji === cards[i2].emoji) {
      // Match found
      cards[i1].matched = true;
      cards[i2].matched = true;
      game.state.scores[playerId]++;
      // Same player goes again — don't switch turn
    } else {
      // No match — cards will be hidden by the client after a delay
      // Switch turn
      game.turn = game.players.find((p) => p !== playerId);
    }
    game.state.flipped = [];

    // Check if all matched
    if (cards.every((c) => c.matched)) {
      const [p1, p2] = game.players;
      if (game.state.scores[p1] > game.state.scores[p2]) game.winner = p1;
      else if (game.state.scores[p2] > game.state.scores[p1]) game.winner = p2;
      else game.winner = "draw";
    }
  } else {
    game.state.flipped = flipped;
  }

  return true;
}

module.exports = { setupSocketHandlers };
