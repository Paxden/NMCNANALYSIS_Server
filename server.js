import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
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
// 🔐 BODY PARSERS
// ==========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// 🌐 CORS (PRODUCTION SAFE)
// ==========================
const allowedOrigins = [
  "http://localhost:5173",
  "https://nmcnanalysis-client.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  }),
);

// ==========================
// 🔐 SESSION CONFIG (CRITICAL FIX)
// ==========================
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
       domain: ".onrender.com",
    },
  }),
);

// ==========================
// 🧪 HEALTH CHECK
// ==========================
app.get("/", (req, res) => {
  res.send("API running...");
});

// ==========================
// 🧩 ROUTES
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/results", resultRoutes);

// ==========================
// 🚀 START SERVER
// ==========================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
