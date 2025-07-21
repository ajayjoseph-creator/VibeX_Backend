import multer from "multer";
import { cloudinaryStorage } from "../config/cloudinary.js"; // ✅ correct name

// Multer setup with Cloudinary storage
const upload = multer({ storage: cloudinaryStorage });

// Upload fields for banner and profile image
export const uploadProfileFields = upload.fields([
  { name: "banner", maxCount: 1 },
  { name: "profile", maxCount: 1 },
]);

export default upload;
