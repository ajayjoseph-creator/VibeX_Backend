import express from "express";
import { uploadReel, toggleLike, getReelsByUser, getAllReels } from "../controllers/reelController.js";
import protect from "../middleware/authMiddleware.js";
import { uploadVideo } from "../middleware/multer.js"; // ✅ Add this

const router = express.Router();

// ✅ Add 'uploadVideo' middleware here
router.post("/upload", protect, uploadReel); 

router.get('/user/:id', getReelsByUser);
router.patch("/:id/like", protect, toggleLike);
router.get('/all', getAllReels); 

export default router;
