import express from "express";
import { uploadReel, getAllReels, toggleLike } from "../controllers/reelController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload_reels", protect, uploadReel);           // POST /api/reels → Upload a reel
router.get("/reels", getAllReels);                        // GET /api/reels → List all reels
router.patch("/:id/like", protect, toggleLike);  // PATCH /api/reels/:id/like → Like/unlike

export default router;
