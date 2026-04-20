import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Routes
import examRoutes from "./routes/examRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import authRoutes from "./routes/AuthRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ==========================
// 🔧 MIDDLEWARE
// ==========================

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// 🌍 CORS (VERY IMPORTANT)
// ==========================
// Allow multiple origins with a function
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://nmcnanalysis-client.vercel.app",
  "https://nmcnanalysis-client-515a2dr14-paxdens-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(null, false); // Change to false to block, or use true to allow all
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // If you're using cookies/sessions
  }),
);

// Handle preflight requests explicitly
app.options("*", cors());

// ==========================
// 🧪 HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.send("🚀 NMCN Analytics API running...");
});

// ==========================
// 📡 ROUTES
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/analytics", analyticsRoutes);

// ==========================
// ❌ 404 HANDLER
// ==========================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ==========================
// ⚠️ GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);

  res.status(500).json({
    message: "Internal server error",
  });
});

// ==========================
// 🚀 START SERVER
// ==========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
