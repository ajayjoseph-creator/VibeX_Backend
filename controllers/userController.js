import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import { sendOTP } from "../utils/sendMail.js";
import { otpStore } from "../utils/otpStore.js";
import dotenv from "dotenv";
dotenv.config();


// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }

  try {
    // check user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // hash password (if you're using bcrypt)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Google Login
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) return res.status(400).json({ success: false, message: "Invalid Google data" });

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "", // No password
        profileImage: picture,
      });
    }

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    res.status(401).json({ success: false, message: "Invalid Google token" });
  }
};

// controllers/otpController.js

export const sendOtpController = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log("Generated OTP:", otp);

  try {
    await sendOTP(email, otp);

    // Store OTP temporarily in memory
    otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 mins
    });

    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

export const verifyOtpController = (req, res) => {
  const { email, otp } = req.body;

  console.log("Incoming verification =>", email, otp);
  const stored = otpStore.get(email);

  if (!stored) {
    console.log("❌ No OTP found for", email);
    return res.status(400).json({ success: false, message: "No OTP found" });
  }

  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    console.log("❌ OTP expired for", email);
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  if (stored.otp.toString() !== otp.toString()) {
    console.log("❌ Invalid OTP. Expected:", stored.otp, "Got:", otp);
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  otpStore.delete(email);
  console.log("✅ OTP verified successfully for", email);
  return res.status(200).json({ success: true, message: "OTP verified" });
};
