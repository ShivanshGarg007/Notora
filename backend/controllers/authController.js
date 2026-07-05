const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cacheService = require('../utils/cache');

const DEV = process.env.NODE_ENV === "development";

exports.register = async (req, res) => {
  if (DEV) console.debug("🟢 [REGISTER] payload:", req.body);
  const { name, email, password } = req.body;

  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Cache user data
    const userData = { id: user._id, name: user.name, email: user.email, role: user.role };
    await cacheService.cacheUser(user._id, userData);
    await cacheService.cacheAuthToken(token, userData);

    res.status(201).json({
      message: "Signup successful",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("❌ [REGISTER] error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
};

exports.login = async (req, res) => {
  if (DEV) console.debug("🔵 [LOGIN] payload:", req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = { 
      id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      isPremium: user.isPremium 
    };

    // Cache user data and auth token
    await cacheService.cacheUser(user._id, userData);
    await cacheService.cacheAuthToken(token, userData);

    res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("❌ [LOGIN] error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // Check cache first
    const cachedUser = await cacheService.getCachedUser(req.user);
    if (cachedUser) {
      console.log(`📦 Cache hit for user: ${req.user}`);
      return res.status(200).json({ 
        user: cachedUser,
        _cached: true,
        _cachedAt: new Date().toISOString()
      });
    }

    const user = await User.findById(req.user).select("name email _id isPremium role");
    console.log('Current user data:', {
      id: user._id,
      name: user.name,
      role: user.role,
      isPremium: user.isPremium
    });
    
    if (!user) return res.status(404).json({ error: "User not found" });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium
    };

    // Cache user data
    await cacheService.cacheUser(req.user, userData);

    res.status(200).json({ 
      user: userData
    });
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    res.status(500).json({ error: "Server error fetching user" });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Invalidate auth token cache
      await cacheService.invalidateAuthToken(token);
    }

    // Invalidate user cache
    if (req.user) {
      await cacheService.invalidateUserCache(req.user);
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error('Error in logout:', err);
    res.status(500).json({ error: "Server error during logout" });
  }
};

// Middleware to validate cached auth token
exports.validateCachedToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Check cache first
    const cachedUser = await cacheService.getCachedAuthToken(token);
    if (cachedUser) {
      console.log(`📦 Cache hit for auth token`);
      req.user = cachedUser.id;
      return next();
    }

    // If not in cache, verify with JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id || decoded.userId;
    
    // Cache the token for future requests
    const user = await User.findById(req.user).select("name email _id isPremium role");
    if (user) {
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium
      };
      await cacheService.cacheAuthToken(token, userData);
    }

    next();
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(401).json({ error: "Invalid token" });
  }
};

