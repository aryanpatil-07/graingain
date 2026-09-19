import http from "http";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import { initDB } from "./services/dbService.js";
import { SocketService } from "./services/socketService.js";
import { registerRequestSocketHandlers } from "./sockets/requestSocket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io with CORS enabled
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

// Initialize Socket Service with io instance
SocketService.init(io);

// Initialize Database on Startup
initDB().catch((err) => console.error("Database initialization failed:", err));

// Socket.io Connection Management
io.on("connection", (socket) => {
  console.log(`🔌 WebSockets: Client connected (${socket.id})`);

  socket.emit("connected_ack", {
    message: "Connected to GrainGain Real-Time Engine",
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Register modular socket event handlers
  registerRequestSocketHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`🔌 WebSockets: Client disconnected (${socket.id})`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 GrainGain Server & WebSockets running on http://localhost:${PORT}`);
  console.log(`⚡ Neon DB Connected & Connected to Socket.io`);
});

export { server, app, io };
