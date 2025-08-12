// ---- server.js ----

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
import notificationRoutes from './routes/notificationRoute.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer(app);

const onlineUsers = {};
const pendingOffers = {}; // 💾 store offers if callee not ready yet
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

export { io, onlineUsers };

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // --- User joins ---
  socket.on('join', (userId) => {
    console.log("📥 JOIN event:", { userId, socketId: socket.id });
    if (!userId) return;
    onlineUsers[userId] = socket.id;
    console.log(`🟢 User ${userId} is online (Socket: ${socket.id})`);
    io.emit('online_users', Object.keys(onlineUsers));
  });

  //--- WebRTC: Offer ---
  socket.on('offer', ({ targetUserId, offer, fromUserId }) => {
    console.log("📥 OFFER:", { fromUserId, targetUserId });
    const targetSocket = onlineUsers[targetUserId];
    console.log("🎯 Target socket for offer:", targetSocket);

    if (targetSocket) {
      io.to(targetSocket).emit('offer', { fromUserId, offer });
      console.log(`📨 Offer sent from ${fromUserId} to ${targetUserId}`);
    } else {
      if (!pendingOffers[targetUserId]) {
        pendingOffers[targetUserId] = [];
      }
      pendingOffers[targetUserId].push({ fromUserId, offer });
      console.warn(`💾 Offer stored for ${targetUserId} (user not ready)`);
    }
  });

  // --- Callee ready to receive offer ---
  socket.on('ready-for-offer', ({ userId }) => {
    console.log(`📥 READY_FOR_OFFER: ${userId}`);
    const targetSocket = onlineUsers[userId];
    if (pendingOffers[userId] && targetSocket) {
      pendingOffers[userId].forEach(({ fromUserId, offer }) => {
        io.to(targetSocket).emit('offer', { fromUserId, offer });
      });
      delete pendingOffers[userId];
      console.log(`📤 Delivered pending offers to ${userId}`);
    }
  });

  // --- WebRTC: Answer ---
  socket.on('answer', ({ targetUserId, answer, fromUserId }) => {
    console.log("📥 ANSWER:", { fromUserId, targetUserId });
    const targetSocket = onlineUsers[targetUserId];
    console.log("🎯 Target socket for answer:", targetSocket);
    if (targetSocket) {
      io.to(targetSocket).emit('answer', { fromUserId, answer });
      console.log(`📩 Answer sent from ${fromUserId} to ${targetUserId}`);
    } else {
      console.warn(`⚠️ User ${targetUserId} is offline, answer not sent`);
    }
  });

  // --- WebRTC: ICE Candidate ---
  socket.on('ice-candidate', ({ targetUserId, candidate, fromUserId }) => {
    console.log("📥 ICE CANDIDATE:", { fromUserId, targetUserId, candidate });
    const targetSocket = onlineUsers[targetUserId];
    console.log("🎯 Target socket for candidate:", targetSocket);
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { fromUserId, candidate });
      console.log(`📡 ICE candidate sent from ${fromUserId} to ${targetUserId}`);
    } else {
      console.warn(`⚠️ User ${targetUserId} is offline, ICE candidate not sent`);
    }
  });

  // --- WebRTC: Call start ---
  socket.on('call_user', ({ targetUserId, fromUserId, metadata }) => {
    console.log("📥 CALL_USER:", { fromUserId, targetUserId, metadata });
    const targetSocket = onlineUsers[targetUserId];
    console.log("🎯 Target socket for call:", targetSocket);
    if (targetSocket) {
      io.to(targetSocket).emit('incoming_call', { fromUserId, metadata });
      console.log(`📞 Call: ${fromUserId} -> ${targetUserId}`);
    } else {
      console.warn(`⚠️ User ${targetUserId} is offline, call not sent`);
    }
  });

  // --- WebRTC: Call end ---
  socket.on('end_call', ({ targetUserId, fromUserId }) => {
    console.log("📥 END_CALL:", { fromUserId, targetUserId });
    const targetSocket = onlineUsers[targetUserId];
    console.log("🎯 Target socket for end call:", targetSocket);
    if (targetSocket) {
      io.to(targetSocket).emit('call_ended', { fromUserId });
      console.log(`🔴 Call ended: ${fromUserId} -> ${targetUserId}`);
    } else {
      console.warn(`⚠️ User ${targetUserId} is offline, end call not sent`);
    }
  });

  // --- Messaging ---
  socket.on('send_message', ({ senderId, receiverId, message }) => {
    console.log("📥 SEND_MESSAGE:", { senderId, receiverId, message });
    const receiverSocket = onlineUsers[receiverId];
    console.log("🎯 Target socket for message:", receiverSocket);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive_message', {
        senderId,
        message,
        createdAt: new Date().toISOString(),
      });
      console.log(`📨 Message sent from ${senderId} to ${receiverId}`);
    } else {
      console.warn(`⚠️ User ${receiverId} is offline, message not sent`);
    }
  });

  // --- Mark messages as read ---
  socket.on("mark_read", async ({ senderId, receiverId }) => {
    console.log("📥 MARK_READ:", { senderId, receiverId });
    try {
      const result = await Message.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false },
        { $set: { isRead: true } }
      );
      console.log(`✅ Updated ${result.modifiedCount} messages as read`);

      const senderSocket = onlineUsers[senderId];
      console.log("🎯 Target socket for read receipt:", senderSocket);
      if (senderSocket) {
        io.to(senderSocket).emit("messages_read", { by: receiverId });
        console.log(`👀 Messages from ${senderId} marked as read by ${receiverId}`);
      }
    } catch (err) {
      console.error("🔥 Failed to mark as read:", err);
    }
  });

  // --- Disconnect handling ---
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Disconnected: ${socket.id} (Reason: ${reason})`);
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log(`🟠 User ${userId} removed from onlineUsers`);
        break;
      }
    }
    io.emit('online_users', Object.keys(onlineUsers));
  });
});

// ---- Middleware & Routes ----
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/messages", messageroute);
app.use("/api/map", mapRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/notifications", notificationRoutes);

// Face verification route
app.get('/api/verify-face', (req, res) => {
  const scriptPath = path.join(__dirname, 'python', 'face_verify.py');
  console.log(`🔍 Running face verification script at ${scriptPath}`);
  exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Python Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) console.error(`Stderr: ${stderr}`);
    console.log(`✅ Face verification result: ${stdout.trim()}`);
    res.json({ result: stdout.trim() });
  });
});

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
