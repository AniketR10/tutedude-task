import { useState } from "react";

const GAMES = [
  { id: "tictactoe", name: "Tic Tac Toe", icon: "❌⭕", desc: "Classic 3x3 grid" },
  { id: "rps", name: "Rock Paper Scissors", icon: "✊✋✌️", desc: "Best of 5 rounds" },
  { id: "memory", name: "Memory Match", icon: "🃏🃏", desc: "Find matching pairs" },
];

export default function GameInviteModal({ connections, onInvite, onClose }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleSend = () => {
    if (selectedGame && selectedPlayer) {
      onInvite(selectedPlayer, selectedGame);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Play a Game</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">&times;</button>
        </div>

        {/* Step 1: Pick a game */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Choose a game</p>
        <div className="space-y-2 mb-4">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGame(g.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                selectedGame === g.id
                  ? "border-indigo-500 bg-indigo-500/20"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              <span className="text-xl">{g.icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium text-white">{g.name}</div>
                <div className="text-xs text-gray-500">{g.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Step 2: Pick a player */}
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Choose opponent</p>
        <div className="space-y-1 mb-5 max-h-32 overflow-y-auto">
          {Array.from(connections.values()).map((conn) => (
            <button
              key={conn.userId}
              onClick={() => setSelectedPlayer(conn.userId)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors ${
                selectedPlayer === conn.userId
                  ? "border-indigo-500 bg-indigo-500/20"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: conn.color }}
              >
                {conn.username[0].toUpperCase()}
              </div>
              <span className="text-sm text-white">{conn.username}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleSend}
          disabled={!selectedGame || !selectedPlayer}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Send Invite
        </button>
      </div>
    </div>
  );
}
