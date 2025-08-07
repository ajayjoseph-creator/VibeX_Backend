import Message from "../models/message.js";

// ✅ Send Message (same as yours, with reply support added)
export const sendMessage = async (req, res) => {
  try {
    const { sender, receiver, message, replyTo } = req.body;

    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = new Message({ sender, receiver, message, replyTo: replyTo || null });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get Messages Between Two Users
export const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender receiver replyTo');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ❤️ React to a Message
export const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;
    const userId = req.user.id;
    const messageId = req.params.id;

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { emoji, user: userId } } },
      { new: true }
    ).populate("reactions.user");

    res.status(200).json(updated);
  } catch (error) {
    console.error("Reaction Error:", error);
    res.status(500).json({ error: "Failed to react to message" });
  }
};

// 🧾 Reply to a message (can also be part of sendMessage as shown above)
export const replyToMessage = async (req, res) => {
  try {
    const { sender, receiver, message, replyTo } = req.body;

    if (!sender || !receiver || !message || !replyTo) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const replyMsg = new Message({ sender, receiver, message, replyTo });
    await replyMsg.save();

    res.status(201).json(replyMsg);
  } catch (error) {
    res.status(500).json({ error: "Server error in reply" });
  }
};


export const searchUsers = async (req, res) => {
  try {
    const { keyword } = req.query;
    const currentUserId = req.user._id;

    // Step 1: Get current user
    const currentUser = await User.findById(currentUserId).select("following");

    // Step 2: Filter following users based on search keyword
    const users = await User.find({
      _id: { $in: currentUser.following }, // only followed users
      name: { $regex: keyword, $options: "i" }, // search by name
    }).select("name profileImage");

    res.json(users);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

export const getFollowedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("following", "name profileImage");
    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: "Error fetching followed users" });
  }
};

export const getLastMessagesAndUnread = async (req, res) => {
  const currentUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 }); // oldest to latest

    const lastMessages = {};
    const unreadCounts = {};

    messages.forEach(msg => {
      const otherUserId =
        msg.sender.toString() === currentUserId
          ? msg.receiver.toString()
          : msg.sender.toString();

      // only override if newer
      lastMessages[otherUserId] = msg;

      // optionally, add unread count logic (if you have `isRead`)
      if (msg.receiver.toString() === currentUserId) {
        unreadCounts[otherUserId] = (unreadCounts[otherUserId] || 0) + 1;
      }
    });

    res.json({ lastMessages, unreadCounts });
  } catch (err) {
    console.error("🔥 Error in getLastMessagesAndUnread:", err);
    res.status(500).json({ message: "Failed to load last messages" });
  }
};