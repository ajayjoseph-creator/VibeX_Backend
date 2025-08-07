import express from "express";
import { uploadReel, getReelsByUser, getAllReels, commentOnReel, likeReel } from "../controllers/reelController.js";
import protect from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/multer.js"; // ✅ Add this

const router = express.Router();

// ✅ Add 'uploadVideo' middleware here
router.post("/upload", protect, uploadImage.single("image"), uploadReel);


router.get('/user/:id', getReelsByUser);
router.put("/like/:id",protect, likeReel);
router.get('/all', getAllReels); 
router.post('/comment/:id', commentOnReel);

export default router;
