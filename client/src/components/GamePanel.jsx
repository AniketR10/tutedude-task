import TicTacToe from "./games/TicTacToe";
import RockPaperScissors from "./games/RockPaperScissors";
import MemoryMatch from "./games/MemoryMatch";

const GAME_TITLES = {
  tictactoe: "Tic Tac Toe",
  rps: "Rock Paper Scissors",
  memory: "Memory Match",
};

export default function GamePanel({ game, currentUserId, onMove, onLeave }) {
  const GameComponent = {
    tictactoe: TicTacToe,
    rps: RockPaperScissors,
    memory: MemoryMatch,
  }[game.gameType];

  if (!GameComponent) return null;

  const opponentId = Object.keys(game.players).find((p) => p !== currentUserId);
  const opponent = game.players[opponentId];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              {GAME_TITLES[game.gameType]}
            </h2>
            <span className="text-xs text-gray-500">vs {opponent?.username}</span>
          </div>
          <button
            onClick={() => onLeave(game.gameId)}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            Leave
          </button>
        </div>

        {/* Game area */}
        <div className="p-6 flex justify-center">
          <GameComponent
            game={game}
            currentUserId={currentUserId}
            onMove={(move) => onMove(game.gameId, move)}
          />
        </div>

        {/* Footer — show rematch / leave on game over */}
        {game.winner && (
          <div className="px-5 py-3 border-t border-white/10 flex justify-center">
            <button
              onClick={() => onLeave(game.gameId)}
              className="px-6 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
