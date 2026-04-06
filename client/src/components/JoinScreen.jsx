import { useState } from "react";

export default function JoinScreen({ onJoin }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onJoin(trimmed);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f23]">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.1,
            }}
          />
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-col items-center gap-6 p-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Virtual Cosmos
        </h1>
        <p className="text-gray-400 text-sm max-w-xs text-center">
          Enter a 2D universe where proximity creates connection. Move close to
          others to start chatting.
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          className="w-72 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 outline-none focus:border-purple-400 transition-colors"
          autoFocus
        />

        <button
          type="submit"
          disabled={!name.trim()}
          className="w-72 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Enter Cosmos
        </button>
      </form>
    </div>
  );
}
