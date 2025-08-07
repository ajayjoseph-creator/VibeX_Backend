import axios from "axios";

export const geocodeLocation = async (req, res) => {
  const { place } = req.query;

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: place,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "VibeX/1.0",
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("Geocoding error:", err.message);
    res.status(500).json({ error: "Failed to geocode location." });
  }
};
