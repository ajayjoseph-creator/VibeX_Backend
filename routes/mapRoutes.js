// routes/mapRoutes.js
import express from "express";
import User from "../models/userModel.js";

const router = express.Router();

// 🌍 Get nearby users
router.get("/nearby", async (req, res) => {
  try {
    const { lng, lat, distance } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: "Coordinates are required" });
    }

    const users = await User.find({
      geoLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseFloat(distance) || 10000, // in meters
        },
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Nearby users error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
