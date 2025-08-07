// routes/location.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const result = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        format: "jsonv2",
        lat,
        lon,
      },
      headers: {
        "User-Agent": "Vibex/1.0", // OSM policy prakarama compulsory
      },
    });

    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

export default router;
