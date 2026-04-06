import { useState, useEffect } from "react";

export default function MemoryMatch({ game, currentUserId, onMove }) {
  const { state, turn, winner, players } = game;
  const { cards, scores } = state;
  const isMyTurn = turn === currentUserId;

  const playerIds = Object.keys(players);

  // Track locally flipped cards for reveal animation
  const [localFlipped, setLocalFlipped] = useState(new Set());
  const [cooldown, setCooldown] = useState(false);

  // Sync flipped cards from server state
  useEffect(() => {
    const serverFlipped = new Set(state.flipped || []);
    setLocalFlipped(serverFlipped);
  }, [state.flipped]);

  // After a mismatch (lastMove resulted in turn change), briefly show then hide
  useEffect(() => {
    if (game.lastMove && localFlipped.size === 0) {
      // Two cards were flipped and didn't match — need a brief cooldown
      setCooldown(true);
      const timer = setTimeout(() => setCooldown(false), 300);
      return () => clearTimeout(timer);
    }
  }, [game.lastMove, localFlipped.size]);

  const handleFlip = (index) => {
    if (!isMyTurn || winner || cooldown) return;
    if (cards[index].matched) return;
    if (localFlipped.has(index)) return;
    if (localFlipped.size >= 2) return;

    setLocalFlipped((prev) => new Set([...prev, index]));
    onMove({ cardIndex: index });
  };

  const isCardVisible = (card, index) => {
    return card.matched || localFlipped.has(index);
  };

  const getStatusText = () => {
    if (winner === "draw") return "It's a tie!";
    if (winner) return winner === currentUserId ? "You won! 🎉" : `${players[winner].username} won!`;
    if (isMyTurn) return "Your turn — flip a card!";
    return "Opponent's turn...";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className={`text-sm font-medium ${isMyTurn && !winner ? "text-green-400" : "text-gray-300"}`}>
        {getStatusText()}
      </p>

      {/* Scoreboard */}
      <div className="flex gap-6 text-sm">
        {playerIds.map((pid) => (
          <div
            key={pid}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              turn === pid && !winner ? "bg-indigo-500/20 border border-indigo-500/40" : "bg-white/5"
            }`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: players[pid].color }}
            >
              {players[pid].username[0].toUpperCase()}
            </div>
            <span className="text-gray-300">
              {pid === currentUserId ? "You" : players[pid].username}
            </span>
            <span className="font-bold text-white">{scores[pid]}</span>
          </div>
        ))}
      </div>

      {/* Card grid (4x4) */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => {
          const visible = isCardVisible(card, i);
          return (
            <button
              key={i}
              onClick={() => handleFlip(i)}
              disabled={visible || !isMyTurn || !!winner || cooldown}
              className={`w-16 h-16 rounded-lg text-2xl flex items-center justify-center transition-all duration-200 ${
                card.matched
                  ? "bg-green-500/20 border border-green-500/30"
                  : visible
                    ? "bg-indigo-500/20 border border-indigo-500/40 scale-105"
                    : isMyTurn && !winner
                      ? "bg-white/10 border border-white/10 hover:bg-indigo-500/20 hover:border-indigo-500/30 cursor-pointer"
                      : "bg-white/10 border border-white/10 cursor-not-allowed"
              }`}
            >
              {visible ? card.emoji : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
