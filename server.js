import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import userRoutes from './routes/userRoutes.js';
import reelRoutes from './routes/reelRoutes.js';
import messageroute from './routes/messageRoutess.js';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Message from './models/message.js'; 
import locationRoutes from "./routes/location.js"; 
import mapRoutes from "./routes/mapRoutes.js";
import notificationRoutes from './routes/notificationRoute.js'
export { io };
dotenv.config();

const app = express();

// Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// In-memory store for connected users
let onlineUsers = {};

io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // User joins
  socket.on('join', (userId) => {
    onlineUsers[userId] = socket.id;
    console.log('🟢 User joined:', userId);

    // Broadcast updated online users
    io.emit('online_users', Object.keys(onlineUsers));
  });

  // Handle sending message
  socket.on('send_message', ({ senderId, receiverId, message }) => {
    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive_message', {
        senderId,
        message,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Handle marking messages as read
  socket.on("mark_read", async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false },
        { $set: { isRead: true } }
      );

      const receiverSocket = onlineUsers[senderId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("messages_read", { by: receiverId });
        console.log(`👀 Messages from ${senderId} marked as read by ${receiverId}`);
      }
    } catch (err) {
      console.error("🔥 Failed to mark as read:", err);
    }
  });

  socket.on("send_notification", ({ receiverId, type, message, senderId }) => {
  const receiverSocket = onlineUsers[receiverId];
  if (receiverSocket) {
    io.to(receiverSocket).emit("receive_notification", {
      senderId,
      type, // e.g., "follow", "like", "comment"
      message,
      createdAt: new Date().toISOString(),
    });
    console.log(`🔔 Notification sent to ${receiverId}:`, message);
  }
});

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Disconnected:', socket.id);
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }

    // Broadcast updated online users
    io.emit('online_users', Object.keys(onlineUsers));
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/messages", messageroute);
app.use("/api/map", mapRoutes); 
app.use("/api/location", locationRoutes);
app.use("/api/notifications", notificationRoutes);

// Python script route
app.get('/api/verify-face', (req, res) => {
  const scriptPath = path.join(__dirname, 'python', 'face_verify.py');

  exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }

    res.json({ result: stdout.trim() });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server Error:", err.message);
    process.exit(1);
  }
};

startServer();
