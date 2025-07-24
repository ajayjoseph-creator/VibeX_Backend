import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
    },

    number: {
      type: Number,
      default: null,
    },

    profileImage: {
      type: String,
    },

    vibe: {
      type: [String],
      default: [],
    },

    baseImage: {
      type: String,
      default: null,
    },

    gender: {
      type: String,
      enum: ["Man", "Woman", "NoFace", "Unknown"],
      default: "Unknown",
    },

    bannerImage: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxLength: 150,
      default: "",
    },

    // ✅ Profession field
    profession: {
      type: String,
      trim: true,
      default: "",
    },

    // ✅ Location field
    location: {
      type: String,
      trim: true,
      default: "",
    },
    // ✅ Post count
    postsCount: {
      type: Number,
      default: 0,
    },

    // ✅ Followers count
    followers: {
      type: Number,
      default: 0,
    },
    recentSearches: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
],

    // ✅ Following count
    following: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
