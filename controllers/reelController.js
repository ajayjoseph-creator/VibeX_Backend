import Reel from "../models/reelsModel.js";

// ✅ Upload a new reel
export const uploadReel = async (req, res) => {
  try {
    const { videoUrl, caption } = req.body;

    const newReel = new Reel({
      user: req.userId, // Make sure `req.userId` is set by auth middleware
      videoUrl,
      caption,
    });

    await newReel.save();
    res.status(201).json({ message: "Reel uploaded successfully", reel: newReel });
  } catch (error) {
    console.error("Reel upload error:", error.message);
    res.status(500).json({ message: "Server error while uploading reel" });
  }
};

// ✅ Get all reels
export const getAllReels = async (req, res) => {
  try {
    const reels = await Reel.find().populate("user", "name profileImage").sort({ createdAt: -1 });
    res.status(200).json(reels);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reels" });
  }
};

// ✅ Like/unlike a reel
export const toggleLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: "Reel not found" });

    const userId = req.userId;
    const isLiked = reel.likes.includes(userId);

    if (isLiked) {
      reel.likes.pull(userId);
    } else {
      reel.likes.push(userId);
    }

    await reel.save();
    res.status(200).json({ message: isLiked ? "Unliked" : "Liked", likes: reel.likes });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
