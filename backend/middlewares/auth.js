const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const auth = async (req, res, next) => {
  try {
    console.log("Auth middleware - Headers:", req.headers);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No token provided");
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token received:", token ? "Present" : "Missing");

    if (!token) {
      console.log("Token is missing");
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        console.log("User not found for token");
        return res.status(401).json({ message: "User not found" });
      }

      console.log("User authenticated:", user.name);
      req.user = user;
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = auth; 