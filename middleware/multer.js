import multer from "multer";
import { imageStorage, videoStorage } from "../config/cloudinary.js";

// For image uploads (profile pics, banners etc.)
export const uploadImage = multer({ storage: imageStorage });

// For video uploads (reels)
export const uploadVideo = multer({ storage: videoStorage });
