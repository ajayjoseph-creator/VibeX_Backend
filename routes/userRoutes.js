import express from "express";
import { getUserProfile, googleLogin, loginUser, registerUser, sendOtpController, uploadImage, verifyOtpController } from "../controllers/userController.js";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import protect from "../middleware/authMiddleware.js";
const upload = multer({ storage });
const router = express.Router();

// POST /api/users/register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
router.post("/upload-image", upload.single("file"), uploadImage);
router.get("/profile/:id",protect, getUserProfile);


export default router;
