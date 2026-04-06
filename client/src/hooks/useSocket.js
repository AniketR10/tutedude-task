import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

export function useSocket(username) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUsers, setOtherUsers] = useState(new Map());
  const [proximityConnections, setProximityConnections] = useState(new Map());
  const [messages, setMessages] = useState(new Map()); // roomId -> messages[]
  const [chatBubbles, setChatBubbles] = useState(new Map());
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [gameInvite, setGameInvite] = useState(null); // incoming invite
  const [sentGameInvite, setSentGameInvite] = useState(null); // outgoing invite status: { status, gameType, targetName }
  const [activeGame, setActiveGame] = useState(null); // current game session

  useEffect(() => {
    if (!username) return;

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { username });
    });

    socket.on("joined", (userData) => {
      setCurrentUser(userData);
    });

    socket.on("existingUsers", (users) => {
      setOtherUsers((prev) => {
        const next = new Map(prev);
        for (const u of users) {
          next.set(u.id, u);
        }
        return next;
      });
    });

    socket.on("userJoined", (userData) => {
      setOtherUsers((prev) => {
        const next = new Map(prev);
        next.set(userData.id, userData);
        return next;
      });
    });

    socket.on("userMoved", ({ id, x, y }) => {
      setOtherUsers((prev) => {
        const next = new Map(prev);
        const user = next.get(id);
        if (user) {
          next.set(id, { ...user, x, y });
        }
        return next;
      });
    });

    socket.on("userLeft", ({ id }) => {
      setOtherUsers((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setProximityConnections((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    });

    socket.on("proximityConnect", ({ userId, username, color, roomId }) => {
      setProximityConnections((prev) => {
        const next = new Map(prev);
        next.set(userId, { userId, username, color, roomId });
        return next;
      });
      // Initialize message list for this room
      setMessages((prev) => {
        const next = new Map(prev);
        if (!next.has(roomId)) {
          next.set(roomId, []);
        }
        return next;
      });
    });

    socket.on("proximityDisconnect", ({ userId }) => {
      setProximityConnections((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        const next = new Map(prev);
        const roomMsgs = next.get(msg.roomId) || [];
        next.set(msg.roomId, [...roomMsgs, msg]);
        return next;
      });

      // Show chat bubble above sender's avatar
      const senderId = msg.senderId;
      setChatBubbles((prev) => {
        const next = new Map(prev);
        next.set(senderId, msg.message);
        return next;
      });
      // Auto-clear bubble after 3 seconds
      setTimeout(() => {
        setChatBubbles((prev) => {
          const next = new Map(prev);
          next.delete(senderId);
          return next;
        });
      }, 3000);

      // Increment unread count for the sender (not for own messages)
      if (senderId !== socket.id) {
        setUnreadCounts((prev) => {
          const next = new Map(prev);
          next.set(senderId, (next.get(senderId) || 0) + 1);
          return next;
        });
      }
    });

    // ===== GAME EVENTS =====
    socket.on("gameInvite", (data) => {
      setGameInvite(data);
    });

    socket.on("gameStart", (data) => {
      setActiveGame(data);
      setGameInvite(null);
      setSentGameInvite(null);
    });

    socket.on("gameDeclined", ({ byName }) => {
      setSentGameInvite({ status: "declined", byName });
      setTimeout(() => setSentGameInvite(null), 3000);
    });

    socket.on("gameUpdate", (data) => {
      setActiveGame((prev) => {
        if (!prev || prev.gameId !== data.gameId) return prev;
        return { ...prev, state: data.state, turn: data.turn, winner: data.winner, lastMove: data.lastMove };
      });
    });

    socket.on("gameEnded", () => {
      setActiveGame(null);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  const emitMove = useCallback((x, y) => {
    socketRef.current?.emit("move", { x, y });
  }, []);

  const sendMessage = useCallback((targetId, message) => {
    socketRef.current?.emit("chatMessage", { targetId, message });
  }, []);

  const clearUnread = useCallback((userId) => {
    setUnreadCounts((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const sendGameInvite = useCallback((targetId, gameType) => {
    socketRef.current?.emit("gameInvite", { targetId, gameType });
    setSentGameInvite({ status: "pending", gameType, targetId });
  }, []);

  const acceptGameInvite = useCallback((fromId, gameType) => {
    socketRef.current?.emit("gameAccept", { fromId, gameType });
  }, []);

  const declineGameInvite = useCallback((fromId) => {
    socketRef.current?.emit("gameDecline", { fromId });
    setGameInvite(null);
  }, []);

  const sendGameMove = useCallback((gameId, move) => {
    socketRef.current?.emit("gameMove", { gameId, move });
  }, []);

  const leaveGame = useCallback((gameId) => {
    socketRef.current?.emit("gameLeave", { gameId });
    setActiveGame(null);
  }, []);

  return {
    connected,
    currentUser,
    setCurrentUser,
    otherUsers,
    proximityConnections,
    messages,
    chatBubbles,
    unreadCounts,
    gameInvite,
    sentGameInvite,
    activeGame,
    emitMove,
    sendMessage,
    clearUnread,
    sendGameInvite,
    acceptGameInvite,
    declineGameInvite,
    sendGameMove,
    leaveGame,
  };
}
