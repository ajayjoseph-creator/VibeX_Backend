import express from "express";
import {
  sendMessage,
  getMessages,
  reactToMessage,
  replyToMessage,
  searchUsers,
  getFollowedUsers,
  getLastMessagesAndUnread
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

// (Optional) Protect route with JWT


const router = express.Router();

// 📤 Send message
router.post("/send", protect, sendMessage);

// 💬 Get all messages between two users
router.get("/:user1/:user2", protect, getMessages);

// ❤️ React to a message
router.put("/react/:id", protect, reactToMessage);

// ↩️ Reply to a message
router.post("/reply", protect, replyToMessage);
router.get("/search", protect, searchUsers);
router.get("/followed", protect, getFollowedUsers);
router.get("/last/:userId", protect, getLastMessagesAndUnread);

export default router;
