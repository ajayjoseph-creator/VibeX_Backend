import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 👇 Image storage (profile, banner, etc.)
export const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vibex_images",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// 👇 Video storage (reels)
export const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vibex_reels",
    resource_type: "video", // ✅ required for video
    allowed_formats: ["mp4", "mov", "avi"],
  },
});

// Export the cloudinary instance too
export { cloudinary };
