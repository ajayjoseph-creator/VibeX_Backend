import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: String,
  sender: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User", 
},
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, index: { expires: 0 } } // 👈 TTL index for expiry
});
export default mongoose.model("Notification", notificationSchema);
