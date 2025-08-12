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




const router = express.Router();


router.post("/send", protect, sendMessage);


router.get("/:user1/:user2", protect, getMessages);


router.put("/react/:id", protect, reactToMessage);


router.post("/reply", protect, replyToMessage);
router.get("/search", protect, searchUsers);
router.get("/followed", protect, getFollowedUsers);
router.get("/last/:userId", protect, getLastMessagesAndUnread);

export default router;
