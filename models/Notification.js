import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["follow", "like", "comment"],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // If notification is related to a post
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
