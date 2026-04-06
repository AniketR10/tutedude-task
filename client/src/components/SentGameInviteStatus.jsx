const GAME_NAMES = {
  tictactoe: "Tic Tac Toe",
  rps: "Rock Paper Scissors",
  memory: "Memory Match",
};

export default function SentGameInviteStatus({ invite, connections }) {
  const target = connections.get(invite.targetId);
  const targetName = target?.username || "player";

  if (invite.status === "declined") {
    return (
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#1a1a2e]/95 border border-red-500/40 rounded-xl px-6 py-4 shadow-2xl backdrop-blur-sm text-center">
          <p className="text-red-400 text-2xl mb-1">✗</p>
          <p className="text-sm text-red-300 font-medium">
            {invite.byName} declined your invite
          </p>
        </div>
      </div>
    );
  }

  // Pending
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#1a1a2e]/95 border border-indigo-500/40 rounded-xl px-6 py-4 shadow-2xl backdrop-blur-sm text-center min-w-[240px]">
        <div className="flex justify-center mb-2">
          <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
          <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms] mx-1" />
          <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-white font-medium">
          Invite sent to {targetName}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {GAME_NAMES[invite.gameType] || invite.gameType} — waiting for response...
        </p>
      </div>
    </div>
  );
}
