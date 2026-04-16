// routes/AuthRoutes.js

import express from "express";
import {
  signup,
  login,
  logout,
  getProfile,
  checkAuth,
} from "../controllers/AuthController.js";
import { auth } from "../middleware/AuthMiddleware.js";

const router = express.Router();
const app = express();

// ==========================
// 🔓 Public Routes
// ==========================
router.post("/signup", signup);
router.post("/login", login);
router.get("/check", checkAuth);

// ==========================
// 🔐 Protected Routes
// ==========================
router.post("/logout", auth, logout);
router.get("/profile", auth, getProfile);

app.get("/api/test-cookie", (req, res) => {
  console.log("COOKIE HEADER:", req.headers.cookie);
  console.log("SESSION:", req.session);

  res.json({
    cookie: req.headers.cookie,
    session: req.session,
  });
});

export default router;