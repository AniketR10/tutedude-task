import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

const SPEED = 4;
const PROXIMITY_RADIUS = 150;
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1500;

export default function Cosmos({
  currentUser,
  setCurrentUser,
  otherUsers,
  proximityConnections,
  chatBubbles,
  emitMove,
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const playerRef = useRef(null);
  const othersRef = useRef(new Map());
  const keysRef = useRef(new Set());
  const posRef = useRef({ x: currentUser.x, y: currentUser.y });

  // Initialize PixiJS
  useEffect(() => {
    const app = new PIXI.Application({
      resizeTo: window,
      backgroundColor: 0x0f0f23,
      antialias: true,
    });
    containerRef.current.appendChild(app.view);
    appRef.current = app;

    // World container (camera follows player)
    const world = new PIXI.Container();
    app.stage.addChild(world);
    worldRef.current = world;

    // Draw grid background
    drawGrid(world);

    // Draw world boundary
    const border = new PIXI.Graphics();
    border.lineStyle(2, 0x334155);
    border.drawRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    world.addChild(border);

    // Create player
    const player = createAvatar(`${currentUser.username} (You)`, currentUser.color, true);
    player.position.set(currentUser.x, currentUser.y);
    world.addChild(player);
    playerRef.current = player;

    // Keyboard input — ignore when typing in an input/textarea
    const isTyping = (e) => {
      const tag = e.target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA";
    };
    const onKeyDown = (e) => { if (!isTyping(e)) keysRef.current.add(e.key.toLowerCase()); };
    const onKeyUp = (e) => { if (!isTyping(e)) keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Game loop
    app.ticker.add(() => {
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.has("w") || keys.has("arrowup")) dy -= SPEED;
      if (keys.has("s") || keys.has("arrowdown")) dy += SPEED;
      if (keys.has("a") || keys.has("arrowleft")) dx -= SPEED;
      if (keys.has("d") || keys.has("arrowright")) dx += SPEED;

      if (dx !== 0 || dy !== 0) {
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          dx *= 0.707;
          dy *= 0.707;
        }

        let newX = posRef.current.x + dx;
        let newY = posRef.current.y + dy;

        // Clamp to world bounds
        newX = Math.max(30, Math.min(WORLD_WIDTH - 30, newX));
        newY = Math.max(30, Math.min(WORLD_HEIGHT - 30, newY));

        posRef.current = { x: newX, y: newY };
        player.position.set(newX, newY);
        emitMove(newX, newY);

        setCurrentUser((prev) =>
          prev ? { ...prev, x: newX, y: newY } : prev
        );
      }

      // Camera follow
      const screenW = app.screen.width;
      const screenH = app.screen.height;
      world.position.set(
        -posRef.current.x + screenW / 2,
        -posRef.current.y + screenH / 2
      );
    });

    const handleResize = () => app.renderer.resize(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", handleResize);
      app.destroy(true, true);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync other users
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;

    const currentOthers = othersRef.current;
    const activeIds = new Set(otherUsers.keys());

    // Remove users who left
    for (const [id, sprite] of currentOthers) {
      if (!activeIds.has(id)) {
        world.removeChild(sprite);
        currentOthers.delete(id);
      }
    }

    // Add/update users
    for (const [id, user] of otherUsers) {
      let sprite = currentOthers.get(id);
      if (!sprite) {
        sprite = createAvatar(user.username, user.color, false);
        world.addChild(sprite);
        currentOthers.set(id, sprite);
      }
      sprite.position.set(user.x, user.y);
    }
  }, [otherUsers]);

  // Draw proximity rings
  useEffect(() => {
    const world = worldRef.current;
    const player = playerRef.current;
    if (!world || !player) return;

    // Remove old proximity graphics
    const toRemove = world.children.filter((c) => c.__proximityGraphic);
    toRemove.forEach((c) => world.removeChild(c));

    // Draw proximity radius around current player
    const ring = new PIXI.Graphics();
    ring.__proximityGraphic = true;
    ring.lineStyle(1, 0x6366f1, 0.3);
    ring.drawCircle(0, 0, PROXIMITY_RADIUS);
    ring.position.set(posRef.current.x, posRef.current.y);
    world.addChild(ring);

    // Draw connection lines
    for (const [userId] of proximityConnections) {
      const otherUser = otherUsers.get(userId);
      if (!otherUser) continue;

      const line = new PIXI.Graphics();
      line.__proximityGraphic = true;
      line.lineStyle(2, 0x6366f1, 0.5);
      line.moveTo(posRef.current.x, posRef.current.y);
      line.lineTo(otherUser.x, otherUser.y);
      world.addChild(line);
    }
  }, [proximityConnections, otherUsers, currentUser?.x, currentUser?.y]);

  // Render chat bubbles above avatars
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;

    // Remove old bubbles
    const toRemove = world.children.filter((c) => c.__chatBubble);
    toRemove.forEach((c) => world.removeChild(c));

    for (const [senderId, message] of chatBubbles) {
      // Find the position — could be another user or self
      let pos = null;
      if (senderId === currentUser.id) {
        pos = posRef.current;
      } else {
        const other = otherUsers.get(senderId);
        if (other) pos = { x: other.x, y: other.y };
      }
      if (!pos) continue;

      const bubble = createChatBubble(message);
      bubble.__chatBubble = true;
      bubble.position.set(pos.x, pos.y - 50);
      world.addChild(bubble);
    }
  }, [chatBubbles, otherUsers, currentUser?.id, currentUser?.x, currentUser?.y]);

  return <div ref={containerRef} className="w-full h-full" />;
}

function createAvatar(name, color, isPlayer) {
  const container = new PIXI.Container();

  // Glow effect for player
  if (isPlayer) {
    const glow = new PIXI.Graphics();
    glow.beginFill(PIXI.utils.string2hex(color), 0.15);
    glow.drawCircle(0, 0, 35);
    glow.endFill();
    container.addChild(glow);
  }

  // Circle body
  const circle = new PIXI.Graphics();
  circle.beginFill(PIXI.utils.string2hex(color));
  circle.drawCircle(0, 0, 22);
  circle.endFill();

  // Inner lighter circle
  const inner = new PIXI.Graphics();
  inner.beginFill(0xffffff, 0.25);
  inner.drawCircle(-5, -5, 8);
  inner.endFill();

  // Name label
  const label = new PIXI.Text(name, {
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    fill: 0xe2e8f0,
    align: "center",
  });
  label.anchor.set(0.5);
  label.position.set(0, 35);

  container.addChild(circle);
  container.addChild(inner);
  container.addChild(label);

  return container;
}

function createChatBubble(message) {
  const container = new PIXI.Container();

  // Truncate long messages
  const display = message.length > 30 ? message.slice(0, 30) + "..." : message;

  const text = new PIXI.Text(display, {
    fontFamily: "Inter, sans-serif",
    fontSize: 11,
    fill: 0xffffff,
    align: "center",
    wordWrap: true,
    wordWrapWidth: 140,
  });
  text.anchor.set(0.5, 1);

  // Background bubble
  const padding = 8;
  const bg = new PIXI.Graphics();
  bg.beginFill(0x6366f1, 0.9);
  bg.drawRoundedRect(
    -text.width / 2 - padding,
    -text.height - padding,
    text.width + padding * 2,
    text.height + padding * 2,
    8
  );
  bg.endFill();

  // Small triangle pointer
  bg.beginFill(0x6366f1, 0.9);
  bg.moveTo(-5, padding);
  bg.lineTo(5, padding);
  bg.lineTo(0, padding + 6);
  bg.closePath();
  bg.endFill();

  container.addChild(bg);
  container.addChild(text);

  return container;
}

function drawGrid(world) {
  const grid = new PIXI.Graphics();
  grid.lineStyle(1, 0x1e293b, 0.3);

  for (let x = 0; x <= WORLD_WIDTH; x += 80) {
    grid.moveTo(x, 0);
    grid.lineTo(x, WORLD_HEIGHT);
  }
  for (let y = 0; y <= WORLD_HEIGHT; y += 80) {
    grid.moveTo(0, y);
    grid.lineTo(WORLD_WIDTH, y);
  }

  // Decorative dots at intersections
  grid.beginFill(0x334155, 0.5);
  for (let x = 0; x <= WORLD_WIDTH; x += 80) {
    for (let y = 0; y <= WORLD_HEIGHT; y += 80) {
      grid.drawCircle(x, y, 1.5);
    }
  }
  grid.endFill();

  world.addChild(grid);
}
