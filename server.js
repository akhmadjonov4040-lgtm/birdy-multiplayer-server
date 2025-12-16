const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

let rooms = {};

function findOrCreateRoom() {
    for (const id in rooms) {
        if (rooms[id].players.length < 5 && !rooms[id].started) {
            return id;
        }
    }
    const id = "room-" + Math.random().toString(36).slice(2, 8);
    rooms[id] = { players: [], started: false };
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
        index: rooms[roomId].players.length - 1
    }));

    if (rooms[roomId].players.length === 5) {
        rooms[roomId].started = true;
        rooms[roomId].players.forEach(p => {
            p.ws.send(JSON.stringify({ type: "start" }));
        });
    }

    ws.on("message", (msg) => {
        rooms[roomId].players.forEach(p => {
            if (p.ws !== ws) p.ws.send(msg.toString());
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

console.log("Server running on", PORT);
