import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import userRoutes from './routes/userRoutes.js';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import reelRoutes from "./routes/reelRoutes.js";


dotenv.config();

const app = express();

// Fix __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB(); // 🔌 Wait for DB connection

    // Routes
    app.use("/api/users", userRoutes);
    app.use("/api/reels", reelRoutes);

    // Python script route
    app.get('/api/verify-face', (req, res) => {
      const scriptPath = path.join(__dirname, 'python', 'face_verify.py');

      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Python Error: ${error.message}`);
          return res.status(500).json({ error: error.message });
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
        }

        res.json({ result: stdout.trim() });
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server Running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Server Error:", err.message);
    process.exit(1);
  }
};

startServer();
