import express from "express";
import User from "../models/userModel.js";
import axios from 'axios'

const router = express.Router();

// 🌍 Nearby users
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
          $maxDistance: parseFloat(distance) || 10000,
        },
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Nearby users error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔍 Search users by location text
router.get("/searchlocation", async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ message: "Location query is required" });
    }

    // 1️⃣ Search users by location text
    const users = await User.find({
      location: { $regex: location, $options: "i" }
    });

    // 2️⃣ Geocode location name → lat/lng
    const geo = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
    );
    const coords = geo.data[0]
      ? [parseFloat(geo.data[0].lon), parseFloat(geo.data[0].lat)]
      : null;

    res.json({
      success: true,
      users,
      coords
    });
  } catch (error) {
    console.error("Location search error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;