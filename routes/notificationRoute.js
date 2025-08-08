import express from "express";
import { getUserNotifications, markAsReadNotification } from "../controllers/notificationController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all notifications for a user
router.get("/:userId", protect, getUserNotifications);
router.patch('/read/:id', protect, markAsReadNotification);

export default router;