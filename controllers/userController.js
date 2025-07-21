import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import { sendOTP } from "../utils/sendMail.js";
import { otpStore } from "../utils/otpStore.js";
import { cloudinary } from '../config/cloudinary.js';
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Register User
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "All fields are required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Google Login
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    if (!email) return res.status(400).json({ success: false, message: "Invalid Google data" });

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, password: "", profileImage: picture });
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

// ✅ Send OTP
export const sendOtpController = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    await sendOTP(email, otp);
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });
    res.status(200).json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ✅ Verify OTP
export const verifyOtpController = (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);

  if (!stored)
    return res.status(400).json({ success: false, message: "No OTP found" });

  if (Date.now() > stored.expires) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  if (stored.otp.toString() !== otp.toString())
    return res.status(400).json({ success: false, message: "Invalid OTP" });

  otpStore.delete(email);
  return res.status(200).json({ success: true, message: "OTP verified" });
};

// ✅ Get Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Update User Vibe
export const updateUserVibe = async (req, res) => {
  const selectedVibes = req.body.selectedVibes;

  if (!Array.isArray(selectedVibes))
    return res.status(400).json({ success: false, message: "Vibes must be an array" });

  try {
    const user = await User.findByIdAndUpdate(req.user._id, { vibe: selectedVibes }, { new: true });
    res.status(200).json({ success: true, message: "Vibes updated successfully", data: user });
  } catch (err) {
    console.error("Update vibe error ➤", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update Profile (with images)


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      bio,
      gender,
      suggestions,
      profession,
      location,
      phone, // 💡 From frontend "phone" comes as string
    } = req.body;

    const updateData = {
      bio,
      gender,
      suggestions,
      profession,
      location,
      number: phone ? Number(phone) : null,
    };

    if (req.files?.banner?.[0]?.path) {
      updateData.bannerImage = req.files.banner[0].path;
    }

    if (req.files?.profile?.[0]?.path) {
      updateData.profileImage = req.files.profile[0].path;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

