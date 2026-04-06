export default function TicTacToe({ game, currentUserId, onMove }) {
  const { state, turn, winner, players } = game;
  const board = state.board;
  const mySymbol = players[currentUserId] ? (Object.keys(players)[0] === currentUserId ? "X" : "O") : null;
  const isMyTurn = turn === currentUserId;

  // Determine the player IDs in order
  const playerIds = Object.keys(players);
  const symbols = { [playerIds[0]]: "X", [playerIds[1]]: "O" };

  const getStatusText = () => {
    if (winner === "draw") return "It's a draw!";
    if (winner) return winner === currentUserId ? "You won! 🎉" : `${players[winner].username} won!`;
    if (isMyTurn) return `Your turn (${mySymbol})`;
    return "Opponent's turn...";
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className={`text-sm font-medium ${isMyTurn && !winner ? "text-green-400" : "text-gray-300"}`}>
        {getStatusText()}
      </p>

      {/* Board */}
      <div className="grid grid-cols-3 gap-1.5">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => {
              if (!cell && isMyTurn && !winner) {
                onMove({ index: i });
              }
            }}
            disabled={!!cell || !isMyTurn || !!winner}
            className={`w-20 h-20 rounded-lg text-3xl font-bold flex items-center justify-center transition-all ${
              cell
                ? "bg-white/10"
                : isMyTurn && !winner
                  ? "bg-white/5 hover:bg-indigo-500/30 cursor-pointer"
                  : "bg-white/5 cursor-not-allowed"
            }`}
          >
            <span className={cell === "X" ? "text-cyan-400" : "text-pink-400"}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      {/* Player info */}
      <div className="flex gap-6 text-xs text-gray-400">
        {playerIds.map((pid) => (
          <div
            key={pid}
            className={`flex items-center gap-1.5 ${turn === pid && !winner ? "text-white" : ""}`}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: players[pid].color }}
            >
              {players[pid].username[0].toUpperCase()}
            </div>
            <span>{pid === currentUserId ? "You" : players[pid].username}</span>
            <span className={symbols[pid] === "X" ? "text-cyan-400" : "text-pink-400"}>
              ({symbols[pid]})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
