import express from "express";
import { googleLogin, loginUser, registerUser, sendOtpController, verifyOtpController } from "../controllers/userController.js";

const router = express.Router();

// POST /api/users/register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);


export default router;
