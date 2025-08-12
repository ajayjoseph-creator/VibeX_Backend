import express from "express";
import { getUserNotifications, markAsRead, createNotification } from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUserNotifications);
router.put("/:notificationId/read", protect, markAsRead);
router.post("/", protect, createNotification);

export default router;
