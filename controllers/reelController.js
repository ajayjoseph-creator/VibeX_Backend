import Reel from "../models/reelsModel.js";

export const uploadReel = async (req, res) => {
  try {
    const { videoUrl, caption } = req.body;
    const userId = req.user?._id;

    console.log("🔥 Uploading reel");
    console.log("➡️ videoUrl:", videoUrl);
    console.log("➡️ caption:", caption);
    console.log("➡️ userId:", userId);

    if (!videoUrl || !userId) {
      return res.status(400).json({ message: "Missing video or user info" });
    }

    const newReel = new Reel({
      videoUrl,
      caption,
      postedBy: userId,
    });

    await newReel.save();
    res.status(201).json({ message: "Reel uploaded successfully", reel: newReel });
  } catch (error) {
    console.error("❌ Error uploading reel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get all reels
export const getReelsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const reels = await Reel.find({ postedBy: userId })
      .sort({ createdAt: -1 }) // latest first
      .populate('postedBy', 'name profileImage'); // optional: to get user info
    res.status(200).json(reels);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching reels for user' });
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
