import multer from "multer";
import { imageStorage, videoStorage } from "../config/cloudinary.js";

// 👤 Image fields (profile + banner)
export const uploadProfileFields = multer({ storage: imageStorage }).fields([
  { name: "banner", maxCount: 1 },
  { name: "profile", maxCount: 1 },
]);

// 🎥 Video field (reel upload)
export const uploadVideo = multer({ storage: videoStorage }).single("video");
