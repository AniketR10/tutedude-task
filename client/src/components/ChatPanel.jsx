import { useState, useRef, useEffect } from "react";

export default function ChatPanel({
  connection,
  messages,
  currentUserId,
  onSend,
  onClose,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSend(trimmed);
      setInput("");
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 flex flex-col bg-[#1a1a2e]/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl overflow-hidden max-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: connection.color }}
          >
            {connection.username[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-white">
              {connection.username}
            </div>
            <div className="text-xs text-green-400">In proximity</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[120px] max-h-[260px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-xs py-4">
            You're now connected! Say hello.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={i}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                  isMine
                    ? "bg-indigo-500/80 text-white rounded-br-sm"
                    : "bg-white/10 text-gray-200 rounded-bl-sm"
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-white/10"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-indigo-400 transition-colors"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-30"
        >
          Send
        </button>
      </form>
    </div>
  );
}
