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

export default router;