import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/connectDB.js';
import userRoutes from './routes/userRoutes.js'

dotenv.config();
const app = express();


// Middleware Setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());


//  MongoDB Connection
connectDB();

//  Python script
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


//Routes
app.use("/api/users", userRoutes);

// Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Running on http://localhost:${PORT}`);
});
