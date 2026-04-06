import { useState, useEffect } from "react";

const CHOICES = [
  { id: "rock", emoji: "🪨", label: "Rock" },
  { id: "paper", emoji: "📄", label: "Paper" },
  { id: "scissors", emoji: "✂️", label: "Scissors" },
];

export default function RockPaperScissors({ game, currentUserId, onMove }) {
  const { state, winner, players } = game;
  const [myChoice, setMyChoice] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const playerIds = Object.keys(players);
  const opponentId = playerIds.find((p) => p !== currentUserId);

  // When round resolves (roundChoices appears), show result briefly
  useEffect(() => {
    if (state.roundChoices) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        setMyChoice(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.round, state.roundChoices]);

  const handleChoice = (choice) => {
    if (myChoice || winner) return;
    setMyChoice(choice);
    onMove({ choice });
  };

  const getStatusText = () => {
    if (winner === "draw") return "Series tied!";
    if (winner) return winner === currentUserId ? "You won the series! 🎉" : `${players[winner].username} won!`;
    if (showResult && state.roundChoices) {
      if (!state.roundWinner) return "Tie round!";
      return state.roundWinner === currentUserId ? "You won this round!" : "You lost this round";
    }
    if (myChoice) return "Waiting for opponent...";
    return `Round ${state.round} — Pick your move!`;
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm font-medium text-gray-300">{getStatusText()}</p>

      {/* Scoreboard */}
      <div className="flex items-center gap-8">
        {playerIds.map((pid) => (
          <div key={pid} className="flex flex-col items-center gap-1">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: players[pid].color }}
            >
              {players[pid].username[0].toUpperCase()}
            </div>
            <span className="text-xs text-gray-400">
              {pid === currentUserId ? "You" : players[pid].username}
            </span>
            <span className="text-2xl font-bold text-white">{state.scores[pid]}</span>
          </div>
        ))}
      </div>

      {/* Show round result */}
      {showResult && state.roundChoices && (
        <div className="flex items-center gap-8 text-4xl">
          <span>{CHOICES.find((c) => c.id === state.roundChoices[currentUserId])?.emoji}</span>
          <span className="text-gray-500 text-lg">vs</span>
          <span>{CHOICES.find((c) => c.id === state.roundChoices[opponentId])?.emoji}</span>
        </div>
      )}

      {/* Choice buttons */}
      {!winner && !showResult && (
        <div className="flex gap-3">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleChoice(c.id)}
              disabled={!!myChoice}
              className={`flex flex-col items-center gap-1 px-5 py-4 rounded-xl border transition-all ${
                myChoice === c.id
                  ? "border-indigo-500 bg-indigo-500/20 scale-110"
                  : myChoice
                    ? "border-white/5 bg-white/5 opacity-30"
                    : "border-white/10 bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:scale-105"
              }`}
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-xs text-gray-400">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600">First to 3 wins</p>
    </div>
  );
}
