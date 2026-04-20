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

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://nmcnanalysis-client.vercel.app/login",
  "https://nmcnanalysis-client.vercel.app",
  "https://nmcnanalysis-client-515a2dr14-paxdens-projects.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("❌ Blocked origin:", origin);
      return callback(new Error("Not allowed by CORS")); // <-- IMPORTANT
    }
  },
  credentials: true, // ✅ REQUIRED if using cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));


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
