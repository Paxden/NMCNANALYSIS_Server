// controllers/AuthController.js

import User from "../models/User.js";

// ==========================
// 📝 Signup
// ==========================
export const signup = async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create user
    const user = await User.create({ email, password, fullName });

    // Start session
    req.session.userId = user._id;

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// 👤 Get Profile
// ==========================
export const getProfile = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
    });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// 🔐 LOGIN CONTROLLER
// ==========================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ==========================
    // VALIDATION
    // ==========================
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    // ==========================
    // FIND USER
    // ==========================
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ==========================
    // PASSWORD CHECK
    // ==========================
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ==========================
    // CREATE SESSION
    // ==========================
    req.session.userId = user._id;

    // IMPORTANT: force session save in production
    await req.session.save();

    // ==========================
    // RESPONSE
    // ==========================
    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================
// 🔓 CHECK AUTH
// ==========================
export const checkAuth = (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ user: null });
    }

    return res.json({
      user: {
        id: req.session.userId,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================
// 🚪 LOGOUT
// ==========================
export const logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
};
