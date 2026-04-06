export default function ConnectionsList({
  connections,
  activeChatUser,
  unreadCounts,
  onSelectChat,
}) {
  return (
    <div className="absolute top-16 right-4 z-20 w-56">
      <div className="bg-[#1a1a2e]/90 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Nearby ({connections.size})
          </h3>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {Array.from(connections.values()).map((conn) => (
            <button
              key={conn.userId}
              onClick={() => onSelectChat(conn.userId)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors ${
                activeChatUser === conn.userId ? "bg-white/10" : ""
              }`}
            >
              <div className="relative shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: conn.color }}
                >
                  {conn.username[0].toUpperCase()}
                </div>
                {unreadCounts.get(conn.userId) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCounts.get(conn.userId) > 9
                      ? "9+"
                      : unreadCounts.get(conn.userId)}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm text-white">{conn.username}</div>
                <div className="text-xs text-green-400">Connected</div>
              </div>
              <div className="text-gray-500 text-lg">💬</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
