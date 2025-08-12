import Notification from "../models/notification.js";
import { io, onlineUsers } from '../server.js';

// Get all notifications for logged-in user
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
      .sort({ createdAt: -1 })
      .populate("sender", "username name profileImage");

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// Mark as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId, { isRead: true }, { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Not found" });
    res.json(notification);
  } catch {
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

// Create and emit notification
export const createNotification = async (req, res) => {
  try {
    let notification = await Notification.create({
      sender: req.user._id,
      receiver: req.body.receiverId,
      type: req.body.type,
      message: req.body.message
    });

    notification = await notification.populate("sender", "username name profilePic");

    const receiverSocket = onlineUsers[req.body.receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_notification", notification);
    }

    res.status(201).json(notification);
  } catch {
    res.status(500).json({ message: "Failed to create notification" });
  }
};
