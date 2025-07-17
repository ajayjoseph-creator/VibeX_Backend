import multer from "multer";
import { storage } from "../utils/cloudinary.js";

const upload = multer({ storage }); // 👈 use Cloudinary storage

export default upload;