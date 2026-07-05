const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const cacheService = require("./utils/cache");
const Message = require("./models/chatModel");
const cron = require('node-cron');
const mongoose = require("mongoose");
const { handleMulterError } = require("./middlewares/upload");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const noteRoutes = require("./routes/noteRoutes");
const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const chatRoutes = require("./routes/chatRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const rateLimitRoutes = require("./routes/rateLimitRoutes");
const contactRoutes = require("./routes/contactRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const healthRoutes = require("./routes/healthRoutes");

require("./passport/google");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://shivansh-notora.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  }
});

// Set port
const PORT = process.env.PORT || 5000;

// ─── Startup banner helper ───────────────────────────────────────────────────
function printStartupBanner(redisOk) {
  const env = process.env.NODE_ENV === 'production' ? 'Production' : 'Development';
  const redisHost = (() => {
    try {
      const url = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
      return `${url.hostname}:${url.port || 6379}`;
    } catch {
      return 'localhost:6379';
    }
  })();

  console.log('');
  console.log('╔══════════════════════════════════╗');
  console.log('║        ✓  Server Started         ║');
  console.log('╚══════════════════════════════════╝');
  console.log('');
  console.log(`  Environment : ${env}`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Redis       : ${redisOk ? 'Connected' : 'Disconnected (degraded mode)'}`);
  if (redisOk) {
    console.log(`  Redis Host  : ${redisHost}`);
    console.log('  Cache       : Ready');
  } else {
    console.log('  Cache       : Disabled');
  }
  console.log('  Socket.IO   : Ready');
  console.log('');
}

// ─── Initialize Redis and MongoDB connections ────────────────────────────────
async function initializeConnections() {
  // 1. Connect to MongoDB — server exits only if Mongo fails (app cannot work without DB)
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }

  // 2. Connect to Redis — server continues even if Redis fails (graceful degradation)
  let redisOk = false;
  try {
    const result = await redisClient.connect();
    redisOk = result !== null && redisClient.isReady();
    if (!redisOk) {
      console.warn("⚠️  Redis unavailable. Application started with Redis disabled.");
    }
  } catch (error) {
    console.warn("⚠️  Redis unavailable. Application started with Redis disabled.");
  }

  // 3. Startup cache warming — async, never blocks server startup, skips if Redis down
  if (redisOk) {
    setImmediate(async () => {
      try {
        // Check if cache already has data before warming
        const existing = await cacheService.getCachedNotesList(null);
        if (!existing) {
          console.log("🔥 Running startup cache warming...");
          await cacheService.warmNotesCache();
          console.log("✅ Startup cache warming complete");
        } else {
          console.log("⚡ Cache already warm — skipping startup warming");
        }
      } catch (error) {
        console.error("❌ Startup cache warming failed (non-fatal):", error.message);
      }
    });
  }

  // 4. Schedule cache warming every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log("🔄 Scheduled cache warming...");
    try {
      await cacheService.warmNotesCache();
      console.log("✅ Cache warming completed");
    } catch (error) {
      console.error("❌ Cache warming failed:", error.message);
    }
  });

  // 5. Health check for cache every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const health = await cacheService.healthCheck();
      if (health.status !== 'healthy') {
        console.warn("⚠️ Cache health check failed:", health.message);
      }
    } catch (error) {
      console.error("❌ Cache health check error:", error.message);
    }
  });

  return redisOk;
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://shivansh-notora.netlify.app",
    "https://notora-backend.onrender.com",
    "https://notora.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "notora_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Error handling middleware ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: err.message
    });
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: Object.values(err.errors).map(e => e.message).join(', ')
    });
  }

  // Handle mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }

  // Handle Cloudinary errors
  if (err.name === 'CloudinaryError') {
    return res.status(500).json({
      error: 'Error uploading file to cloud storage'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Routes ─────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("Welcome to Notora Backend");
});

// Cache health check endpoint
app.get("/api/cache/health", async (req, res) => {
  try {
    const health = await cacheService.healthCheck();
    const stats = await cacheService.getCacheStats();
    res.json({ health, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cache management endpoints (admin only)
app.get("/api/cache/stats", async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/cache/clear", async (req, res) => {
  try {
    const { pattern } = req.body;
    if (pattern) {
      await cacheService.deletePattern(pattern);
      res.json({ message: `Cache cleared for pattern: ${pattern}` });
    } else {
      // Clear all cache
      await cacheService.deletePattern('*');
      res.json({ message: "All cache cleared" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/notes", noteRoutes);
app.use("/api/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/rate-limit", rateLimitRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/health", healthRoutes);

// ─── Socket.IO connection handling ──────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token not provided"));
    }

    // Check cache first for user data
    const cachedUser = await cacheService.getCachedAuthToken(token);
    if (cachedUser) {
      socket.user = cachedUser;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.name);

  socket.on("join_room", async (room) => {
    try {
      console.log(`${socket.user.name} joined room: ${room}`);
      socket.join(room);

      // Check cache first for chat messages
      const cachedMessages = await cacheService.getCachedChatMessages(room);
      if (cachedMessages) {
        console.log(`📦 Cache hit for chat room: ${room}`);
        socket.emit("room_messages", cachedMessages);
        return;
      }

      // Fetch recent messages for the room
      const messages = await Message.find({ room })
        .sort({ timestamp: 1 })
        .limit(50)
        .populate("sender", "name");

      // Cache the messages
      await cacheService.cacheChatMessages(room, messages);

      socket.emit("room_messages", messages);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error", "Failed to join room");
    }
  });

  socket.on("send_message", async (messageData) => {
    try {
      console.log("Received message:", messageData);
      
      // Create new message
      const message = new Message({
        content: messageData.content,
        room: messageData.room,
        sender: socket.user._id,
        senderName: socket.user.name,
        isAdmin: socket.user.role === "admin", // Set isAdmin based on user role
        timestamp: new Date()
      });

      await message.save();
      console.log("Message saved:", message);

      // Invalidate chat cache for this room
      await cacheService.invalidateChatCache(messageData.room);

      // Broadcast message to room
      io.to(messageData.room).emit("receive_message", {
        _id: message._id,
        content: message.content,
        room: message.room,
        sender: message.sender,
        senderName: message.senderName,
        isAdmin: message.isAdmin,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user?.name);
  });
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  try {
    await redisClient.disconnect();
    console.log('✅ Redis disconnected');
  } catch {
    // ignore
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── Start server ────────────────────────────────────────────────────────────
// Initialize connections first, then bind the port
(async () => {
  const redisOk = await initializeConnections();
  httpServer.listen(PORT, () => {
    printStartupBanner(redisOk);
  });
})();