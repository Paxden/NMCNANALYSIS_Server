// controllers/AuthController.js

import User from "../models/User.js";

// ==========================
// 📝 Signup
// ==========================
export const signup = async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    // Validate input
    if (!email || !password || !fullName ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create user
    const user = await User.create({ email, password, fullName,  });

    // Start session
    req.session.userId = user._id;

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// 🔐 Login
// ==========================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // ⚠️ IMPORTANT: include password explicitly
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Start session
    req.session.userId = user._id;

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
    return res.status(500).json({ message: "Server error" });
  }
};

// ==========================
// 🚪 Logout
// ==========================
export const logout = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // ⚠️ Use your custom session cookie name
    res.clearCookie("school_portal_sid");

    return res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    next(err);
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

// Check Auth
export const checkAuth = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ isAuthenticated: false });
    }

    const user = await User.findById(req.session.userId).select("-password");

    res.json({
      isAuthenticated: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
