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
import mongoose from "mongoose";
import asyncHandler from 'express-async-handler';
import  Notification  from "../models/Notification.js";
import { io } from '../server.js';
import axios from 'axios'


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
  console.log("otp:",otp)

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

export const getVibe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, selectedVibes: user.vibe });
  } catch (err) {
    console.error("Error fetching vibes:", err);
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
      phone, // From frontend "phone" comes as string
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

    // 🌍 If location is provided, fetch coordinates from OpenStreetMap
    if (location) {
      const geo = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );

      if (geo.data.length > 0) {
        updateData.geoLocation = {
          type: "Point",
          coordinates: [
            parseFloat(geo.data[0].lon), // longitude
            parseFloat(geo.data[0].lat), // latitude
          ],
        };
      }
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

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Create case-insensitive regex
    const searchRegex = new RegExp(q, "i");

    const users = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { vibe: { $in: [searchRegex] } }
      ],
    }).select("name profileImage vibe");

    res.status(200).json(users);
  } catch (err) {
    console.error("❌ Error in searchUsers:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const addRecentSearch = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const searchedUserId = req.body.userId;

    const user = await User.findById(userId);

    // Remove if already exists to re-add it on top
    user.recentSearches = user.recentSearches.filter(
      (id) => id.toString() !== searchedUserId
    );

    user.recentSearches.unshift(searchedUserId);

    // Keep only 5 recent
    if (user.recentSearches.length > 5) {
      user.recentSearches.pop();
    }

    await user.save();

    res.status(200).json({ success: true, recent: user.recentSearches });
  } catch (err) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


export const removeRecentSearch = async (req, res) => {
  try {
    const userId = req.user._id;
    const removeId = req.params.id;

    const user = await User.findById(userId);
    user.recentSearches = user.recentSearches.filter(
      (id) => id.toString() !== removeId
    );

    await user.save();

    res.status(200).json({ success: true, recent: user.recentSearches });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove search" });
  }
};


export const getRecentSearches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "recentSearches",
      "name profileImage profession"
    );
    res.status(200).json({ success: true, recent: user.recentSearches });
  } catch (err) {
    res.status(500).json({ success: false, message: "Couldn't fetch" });
  }
};

// Follow user
export const followUser = async (req, res) => {
  const { id } = req.params; // The user to follow
  const me = req.user._id;
  console.log("me:" , me)

  if (me.toString() === id.toString()) {
    return res.status(400).json({ message: "You can't follow yourself!" });
  }

  try {
    const [userToFollow, currentUser] = await Promise.all([
      User.findById(id),
      User.findById(me),
    ]);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const meObjId = new mongoose.Types.ObjectId(me);
    const targetObjId = new mongoose.Types.ObjectId(id);

    const alreadyFollowing = userToFollow.followers.includes(meObjId.toString());

    if (!alreadyFollowing) {
      // 🧠 Update DB
      userToFollow.followers.push(meObjId);
      currentUser.following.push(targetObjId);
      await userToFollow.save();
      await currentUser.save();

      // 🔔 Save Notification to DB with 1-day auto expiry
      await Notification.create({
        type: "follow",
        sender: me,
        receiver: id,
        message: `${currentUser?.name || "Someone"} followed you`,
        expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day expiry
      });
      console.log("currentUser.name:", currentUser?.name);


      // 🔔 Real-time notification
      io.to(id).emit("receive_notification", {
        senderId: me,
        type: "follow",
        message: `${currentUser.name} followed you`,
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({ message: "Followed successfully!" });
    } else {
      return res.status(400).json({ message: "Already following!" });
    }
  } catch (err) {
    console.error("❌ Follow error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};




export const unfollowUser = async (req, res) => {
  const { id } = req.params;
  const me = req.user._id;

  try {
    const [userToUnfollow, currentUser] = await Promise.all([
      User.findById(id),
      User.findById(me),
    ]);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure both arrays exist
    if (!Array.isArray(userToUnfollow.followers)) userToUnfollow.followers = [];
    if (!Array.isArray(currentUser.following)) currentUser.following = [];

    const meObjId = new mongoose.Types.ObjectId(me);
    const targetObjId = new mongoose.Types.ObjectId(id);

    // Remove me from target's followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (followerId) => followerId.toString() !== meObjId.toString()
    );

    // Remove target from my following list
    currentUser.following = currentUser.following.filter(
      (followingId) => followingId.toString() !== targetObjId.toString()
    );

    await userToUnfollow.save();
    await currentUser.save();

    res.status(200).json({ message: "Unfollowed successfully!" });
  } catch (err) {
    console.error("❌ Unfollow error:", err);
    res.status(500).json({
      message: "Error unfollowing user",
      error: err.message,
    });
  }
};

// ✅ Reset Password with OTP
export const resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const stored = otpStore.get(email);

  if (!stored || stored.otp.toString() !== otp.toString()) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    otpStore.delete(email);

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Password Reset Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// controller
export const searchUsersByLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Coordinates are required" });
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  const users = await User.find({
    geoLocation: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parsedLng, parsedLat], // ✅ Numbers, not strings!
        },
        $maxDistance: 5000,
      },
    },
  });

  console.log("Searching near:", parsedLat, parsedLng);
  console.log("Coordinates for MongoDB:", [parsedLng, parsedLat]);

  res.json(users);
});

// controllers/userController.js

export const getNearbyUsers = async (req, res) => {
  try {
    const { latitude, longitude, maxDistanceInKm = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    const coords = [parseFloat(longitude), parseFloat(latitude)];

    const nearbyUsers = await User.find({
      geoLocation: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: coords,
          },
          $maxDistance: maxDistanceInKm * 1000, // Convert km to meters
        },
      },
    });

    console.log("Fetched users:", nearbyUsers);
    res.status(200).json(nearbyUsers);
  } catch (error) {
    console.error("Error finding nearby users:", error);
    res.status(500).json({ message: "Server error", error });
  }
};