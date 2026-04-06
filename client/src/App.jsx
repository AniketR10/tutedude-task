import { useState } from "react";
import { useSocket } from "./hooks/useSocket";
import JoinScreen from "./components/JoinScreen";
import Cosmos from "./components/Cosmos";
import ChatPanel from "./components/ChatPanel";
import ConnectionsList from "./components/ConnectionsList";
import GameInviteModal from "./components/GameInviteModal";
import GameInviteNotification from "./components/GameInviteNotification";
import GamePanel from "./components/GamePanel";
import SentGameInviteStatus from "./components/SentGameInviteStatus";

export default function App() {
  const [username, setUsername] = useState("");
  const {
    connected,
    currentUser,
    setCurrentUser,
    otherUsers,
    proximityConnections,
    messages,
    chatBubbles,
    unreadCounts,
    gameInvite,
    sentGameInvite,
    activeGame,
    emitMove,
    sendMessage,
    clearUnread,
    sendGameInvite,
    acceptGameInvite,
    declineGameInvite,
    sendGameMove,
    leaveGame,
  } = useSocket(username);

  const [activeChatUser, setActiveChatUser] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);

  if (!username) {
    return <JoinScreen onJoin={setUsername} />;
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0f0f23]">
        <div className="text-xl text-gray-400 animate-pulse">
          Entering the Cosmos...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#0f0f23]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 bg-[#0f0f23]/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Virtual Cosmos
          </h1>
          <span className="text-xs text-gray-500">
            {connected ? "Connected" : "Disconnected"}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Games button — only show when there are nearby users */}
          {proximityConnections.size > 0 && (
            <button
              onClick={() => setShowGameModal(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/80 to-pink-500/80 text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              🎮 Play Game
            </button>
          )}
          <span className="text-sm text-gray-400">
            {otherUsers.size + 1} online
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.username[0].toUpperCase()}
          </div>
          <span className="text-sm">{currentUser.username}</span>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-600">
        Use WASD or Arrow keys to move
      </div>

      {/* Canvas */}
      <Cosmos
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        otherUsers={otherUsers}
        proximityConnections={proximityConnections}
        chatBubbles={chatBubbles}
        emitMove={emitMove}
      />

      {/* Connections List */}
      {proximityConnections.size > 0 && (
        <ConnectionsList
          connections={proximityConnections}
          activeChatUser={activeChatUser}
          unreadCounts={unreadCounts}
          onSelectChat={(userId) => {
            setActiveChatUser(activeChatUser === userId ? null : userId);
            if (userId) clearUnread(userId);
          }}
        />
      )}

      {/* Chat Panel */}
      {activeChatUser && proximityConnections.has(activeChatUser) && (
        <ChatPanel
          connection={proximityConnections.get(activeChatUser)}
          messages={messages.get(
            proximityConnections.get(activeChatUser).roomId
          ) || []}
          currentUserId={currentUser.id}
          onSend={(msg) => sendMessage(activeChatUser, msg)}
          onClose={() => setActiveChatUser(null)}
        />
      )}

      {/* Game Invite Modal */}
      {showGameModal && (
        <GameInviteModal
          connections={proximityConnections}
          onInvite={sendGameInvite}
          onClose={() => setShowGameModal(false)}
        />
      )}

      {/* Incoming Game Invite Notification */}
      {gameInvite && (
        <GameInviteNotification
          invite={gameInvite}
          onAccept={acceptGameInvite}
          onDecline={declineGameInvite}
        />
      )}

      {/* Outgoing Game Invite Status (pending / declined) */}
      {sentGameInvite && (
        <SentGameInviteStatus
          invite={sentGameInvite}
          connections={proximityConnections}
        />
      )}

      {/* Active Game */}
      {activeGame && (
        <GamePanel
          game={activeGame}
          currentUserId={currentUser.id}
          onMove={sendGameMove}
          onLeave={leaveGame}
        />
      )}
    </div>
  );
}
