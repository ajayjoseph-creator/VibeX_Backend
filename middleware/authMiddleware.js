import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      return next(); // ✅ Don't forget return
    } catch (error) {
      console.error("❌ JWT verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "No token, authorization denied",
  });
};

export default protect;
