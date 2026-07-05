const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error checking admin status" });
  }
};

module.exports = { adminMiddleware }; 