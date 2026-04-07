# Virtual Cosmos

A 2D virtual space where users move around and interact in real time. Walk close to someone, chat connects. Walk away, chat disconnects. Challenge nearby players to mini-games.

## Tech Stack

- **Frontend:** React, Vite, PixiJS, Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB (optional, works without it too)

## Setup

**Prerequisites:** Node.js 18+, MongoDB (optional)

```bash
# Install
cd server && npm install
cd ../client && npm install

# Configure (optional as defaults work locally)
cd ../server && cp .env.example .env

# Run (two terminals)
cd server && npm run dev     # backend
cd client && npm run dev     # frontend
```

Open `http://localhost:5173` in multiple tabs to test multiplayer.

## How It Works

1. Enter a username and spawn into the cosmos
2. Move around with **WASD** or **Arrow keys**
3. Walk close to another user, a connection forms, click to chat
4. Walk away, connection and chat disconnect automatically
5. Click **Play Game** to invite a nearby user to a mini-game (Tic Tac Toe, Rock Paper Scissors, Memory Match)

## Architecture

```
Browser (React + PixiJS)  <-- WebSocket -->  Server (Node.js + Socket.IO)
     |                                            |
  Canvas rendering                          User positions
  Chat UI                                   Proximity checks
  Game UI                                   Game logic
                                            MongoDB (optional)
```

## Key Decisions

- **PixiJS** for the canvas - handles rendering, sprites, and camera smoothly compared to raw Canvas API
- **Server-side proximity detection** - the server checks distances on every move and tells clients when to connect/disconnect, keeping logic centralized
- **Server-authoritative games** - all game state and move validation runs on the server so no one can cheat
- **MongoDB is optional** - the server stores everything in memory by default. MongoDB just adds persistence across restarts
- **Socket.IO** over raw WebSockets - gives us rooms, auto-reconnection, and event-based messaging out of the box

