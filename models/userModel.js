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
    profession: {
      type: String,
      trim: true,
      default: "",
    },

    // ✅ 🔥 Add this for geolocation (MUST for Leaflet)
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    postsCount: {
      type: Number,
      default: 0,
    },
    recentSearches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// 🧠 Add geospatial index
userSchema.index({ geoLocation: "2dsphere" });

const User = mongoose.model("User", userSchema);
export default User;
