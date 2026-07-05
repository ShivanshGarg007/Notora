const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find existing user by email
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Create new user if doesn't exist
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "GoogleOAuth", // Dummy password
            role: "user" // Default role for new users
          });
          await user.save();
          console.log('Created new user via Google auth:', {
            email: user.email,
            role: user.role
          });
        } else {
          // Update existing user's name if changed
          if (user.name !== profile.displayName) {
            user.name = profile.displayName;
            await user.save();
          }
          console.log('Found existing user via Google auth:', {
            email: user.email,
            role: user.role
          });
        }

        return done(null, user);
      } catch (err) {
        console.error('Google auth error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
  const user = await User.findById(id);
  done(null, user);
  } catch (err) {
    done(err, null);
  }
});

