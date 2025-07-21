import express from "express";
import {
  getUserProfile,
  googleLogin,
  loginUser,
  registerUser,
  sendOtpController,
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

export default router;
