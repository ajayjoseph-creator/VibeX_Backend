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
    profileImage:{
      type:String,
    },

    vibe: {
      type: [String],
      default: [],
    },

    // 👉 Add this field for face verification base image
    baseImage: {
      type: String, // base64 string OR image file path (your choice)
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


const User = mongoose.model("User", userSchema);
export default User;
