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

// ✅ Middleware - Order matters! Put these BEFORE routes
app.use(express.json()); // Parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://nmcnanalysis-client.vercel.app/",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

// Routes
app.get("/", (req, res) => {
  res.send("API running...");
});

app.use("/api/exams", examRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/auth", authRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`),
);
