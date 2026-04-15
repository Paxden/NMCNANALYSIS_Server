// middleware/AuthMiddleware.js

export const auth = (req, res, next) => {
  try {
    console.log("🔐 Auth middleware - Session:", req.session);

    if (req.session && req.session.userId) {
      console.log("✅ Auth passed");
      return next();
    }

    console.log("❌ Auth failed - No session");
    return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
