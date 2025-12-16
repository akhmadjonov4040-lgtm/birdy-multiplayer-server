const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 3;

const wss = new WebSocketServer({ server });

let rooms = {};

function findOrCreateRoom() {
  for (const id in rooms) {
    if (rooms[id].players.length < MAX_PLAYERS && !rooms[id].started) {
      return id;
    }
  }

  const id = "room-" + Math.random().toString(36).slice(2, 8);
  rooms[id] = {
    players: [],
    started: false
  };
  return id;
}

wss.on("connection", (ws) => {
  const playerId = Math.random().toString(36).slice(2, 9);
  const roomId = findOrCreateRoom();

  rooms[roomId].players.push({ id: playerId, ws });

  ws.send(JSON.stringify({
    type: "joined",
    playerId,
    roomId,
    index: rooms[roomId].players.length - 1,
    maxPlayers: MAX_PLAYERS
  }));

  if (rooms[roomId].players.length === MAX_PLAYERS) {
    rooms[roomId].started = true;
    rooms[roomId].players.forEach(p => {
      p.ws.send(JSON.stringify({ type: "start" }));
    });
  }

  ws.on("message", (msg) => {
    rooms[roomId].players.forEach(p => {
      if (p.ws !== ws) {
        p.ws.send(msg.toString());
      }
    });
  });

  ws.on("close", () => {
    rooms[roomId].players =
      rooms[roomId].players.filter(p => p.id !== playerId);

    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
    }
  });
});

server.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
