const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { register, login, getCurrentUser } = require("../controllers/authController");
const { rateLimits } = require("../middlewares/rateLimit");
const router = express.Router();
const passport = require("passport");
require("../passport/google");
const User = require("../models/User");
const tokenStore = require("../utils/tokenStore");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");

// Google OAuth routes
router.get("/google", rateLimits.public, passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  rateLimits.public,
  passport.authenticate("google", {
    successRedirect: process.env.FRONTEND_URL || "http://localhost:5173/",
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
  })
);

// Auth routes
router.post("/logout", rateLimits.auth, async (req, res) => {
  const authHeader = req.header("Authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(400).json({ error: "Token not provided" });
  }

  try {
    // Optional: decode token to get expiry time
    const decoded = jwt.decode(token);
    const exp = decoded.exp; // in seconds

    // Calculate TTL
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;

    if (ttl > 0) {
      await tokenStore.setEx(`blacklist_${token}`, ttl, "true");
    }

    return res.status(200).json({ message: "Logout successful and token blacklisted" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, getCurrentUser);

// Login route
router.post("/login", rateLimits.auth, async (req, res) => {
  try {
    console.log("Login attempt:", { 
      email: req.body.email,
      hasPassword: !!req.body.password,
      headers: req.headers,
      origin: req.headers.origin
    });
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("Missing credentials");
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium
    };

    console.log("Login successful for user:", {
      name: user.name,
      role: user.role,
      isPremium: user.isPremium
    });
    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Register route
router.post("/register", rateLimits.auth, async (req, res) => {
  try {
    console.log("Registration attempt:", { email: req.body.email });
    
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log("Missing registration fields");
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (password will be hashed by the pre-save middleware)
    const user = new User({
      name,
      email,
      password,
      role: "user" // Default role
    });

    await user.save();
    console.log("User registered successfully:", name);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium
    };

    res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Update user premium status
router.patch("/update-premium", rateLimits.general, async (req, res) => {
  try {
    const { userId, isPremium } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log("Updating premium status:", {
      userId,
      isPremium,
      currentTime: new Date().toISOString()
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { isPremium: isPremium },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Updated user premium status:", {
      userId: user._id,
      name: user.name,
      email: user.email,
      isPremium: user.isPremium,
      updatedAt: new Date().toISOString()
    });

    res.json({
      message: "Premium status updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error("Error updating premium status:", error);
    res.status(500).json({ message: "Server error updating premium status" });
  }
});

module.exports = router;
