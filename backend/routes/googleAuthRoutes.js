// app.use("/api/auth", googleAuthRoutes);

const express = require("express");
const passport = require("passport");
const { success, failure } = require("../controllers/googleAuthController");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Start Google OAuth flow
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
    session: false
  }),
  (req, res) => {
    console.log('Google callback user:', {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    });

    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Include role in user data
    const userData = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isPremium: req.user.isPremium
    };
    
    console.log('Sending user data:', userData);
    
    const queryParams = new URLSearchParams({
      token,
      user: JSON.stringify(userData)
    });

    // Redirect to the frontend callback route

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl.replace(/\/+$/, '')}/auth/google/callback?${queryParams.toString()}`;
    // const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?${queryParams.toString()}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  }
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

// Optional success/failure routes
router.get("/success", success);
router.get("/failure", failure);

module.exports = router;

