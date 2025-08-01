import express from "express";
import {
  addRecentSearch,
  followUser,
  getRecentSearches,
  getUserProfile,
  googleLogin,
  loginUser,
  registerUser,
  removeRecentSearch,
  searchUsers,
  sendOtpController,
  unfollowUser,
  updateProfile,
  updateUserVibe,
  verifyOtpController,
} from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import { uploadProfileFields } from "../middleware/uploadImage.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.get("/profile/:id", protect, getUserProfile);
router.put("/vibe", protect, updateUserVibe);
router.put("/profile/update/:id", protect, uploadProfileFields, updateProfile);
router.get("/search", searchUsers);
router.post("/recent-search", protect, addRecentSearch);
router.delete("/recent-search/:id", protect, removeRecentSearch);
router.get("/recent-search", protect, getRecentSearches);
router.post("/follow/:id", protect, followUser);
router.put("/unfollow/:id", protect, unfollowUser);
router.post("/list", async (req, res) => {
  try {
    const users = await User.find({ _id: { $in: req.body.ids } }).select("name profileImage");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
