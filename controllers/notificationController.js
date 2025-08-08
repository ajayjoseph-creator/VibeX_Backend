import Notification from "../models/Notification.js";

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'username'); 

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching notifications' });
  }
};

export const markAsReadNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification" });
  }
};
