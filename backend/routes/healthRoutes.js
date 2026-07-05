const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const cacheService = require('../utils/cache');

/**
 * GET /api/health
 *
 * Lightweight health endpoint suitable for Render.com's health check probes.
 * Never performs expensive DB queries — only a Redis PING and a Mongoose state check.
 *
 * Response shape (always HTTP 200):
 * {
 *   status:    "ok" | "degraded",
 *   uptime:    <seconds>,
 *   timestamp: <ISO 8601>,
 *   environment: "production" | "development",
 *   redis: {
 *     connected: boolean,
 *     latency:   number | null   // ms
 *   },
 *   mongodb: {
 *     connected: boolean,
 *     state:     string
 *   },
 *   cache: {
 *     ready: boolean
 *   }
 * }
 */
router.get('/', async (req, res) => {
  try {
    // ── Redis check ─────────────────────────────────────────────────────────
    const redisConnected = redisClient.isReady();
    const redisLatency   = await redisClient.ping(); // null if not connected

    // ── MongoDB check (state only — no query) ────────────────────────────────
    const mongoState = mongoose.connection.readyState;
    // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const mongoStateStr = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState] ?? 'unknown';
    const mongoConnected = mongoState === 1;

    // ── Cache readiness ──────────────────────────────────────────────────────
    const cacheReady = cacheService && redisConnected;

    // ── Overall status ───────────────────────────────────────────────────────
    const status = (mongoConnected && redisConnected) ? 'ok' : 'degraded';

    res.status(200).json({
      status,
      uptime:      Math.floor(process.uptime()),
      timestamp:   new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      redis: {
        connected: redisConnected,
        latency:   redisLatency
      },
      mongodb: {
        connected: mongoConnected,
        state:     mongoStateStr
      },
      cache: {
        ready: cacheReady
      }
    });
  } catch (error) {
    // Should never throw, but be defensive — still return 200 for Render
    res.status(200).json({
      status:    'degraded',
      uptime:    Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      error:     error.message
    });
  }
});

module.exports = router;