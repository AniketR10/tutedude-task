const GAME_NAMES = {
  tictactoe: "Tic Tac Toe",
  rps: "Rock Paper Scissors",
  memory: "Memory Match",
};

export default function GameInviteNotification({ invite, onAccept, onDecline }) {
  // Show "declined" toast
  if (invite.declined) {
    return (
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/40 backdrop-blur-sm">
        <p className="text-sm text-red-300">{invite.byName} declined your game invite</p>
      </div>
    );
  }

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-[#1a1a2e]/95 border border-indigo-500/50 rounded-xl px-5 py-4 shadow-2xl backdrop-blur-sm min-w-[280px]">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: invite.fromColor }}
          >
            {invite.fromName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{invite.fromName}</p>
            <p className="text-xs text-indigo-300">
              wants to play {GAME_NAMES[invite.gameType] || invite.gameType}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(invite.fromId, invite.gameType)}
            className="flex-1 py-2 rounded-lg bg-green-500/80 text-white text-sm font-medium hover:bg-green-500 transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => onDecline(invite.fromId)}
            className="flex-1 py-2 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
