const redisClient = require('../config/redis');

class RateLimiter {
  constructor() {
    this.defaultLimits = {
      // General API limits
      general: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
      
      // Authentication endpoints
      auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 login attempts per 15 minutes
      
      // Notes endpoints
      notes: { windowMs: 60 * 1000, max: 30 }, // 30 requests per minute
      notesUpload: { windowMs: 60 * 1000, max: 3 }, // 3 uploads per minute
      
      // Chat endpoints
      chat: { windowMs: 60 * 1000, max: 25 }, // 25 messages per minute
      
      // OCR endpoints
      ocr: { windowMs: 60 * 1000, max: 5 }, // 5 OCR requests per minute
      
      // Admin endpoints
      admin: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
      
      // Public endpoints (no auth required)
      public: { windowMs: 60 * 1000, max: 60 }, // 60 requests per minute
    };
  }

  // Generate a unique key for rate limiting
  generateKey(identifier, type) {
    const now = Math.floor(Date.now() / 1000);
    const window = Math.floor(now / (this.defaultLimits[type]?.windowMs / 1000));
    return `ratelimit:${type}:${identifier}:${window}`;
  }

  // Check if request is within rate limit
  async checkLimit(identifier, type = 'general') {
    try {
      if (!redisClient.isReady()) {
        console.warn('Redis not ready, skipping rate limit check');
        return { allowed: true, remaining: 999, resetTime: Date.now() + 60000 };
      }

      const limit = this.defaultLimits[type] || this.defaultLimits.general;
      const key = this.generateKey(identifier, type);
      
      const client = redisClient.getClient();
      
      // Get current count
      const current = await client.get(key);
      const count = current ? parseInt(current) : 0;
      
      if (count >= limit.max) {
        // Calculate reset time
        const now = Math.floor(Date.now() / 1000);
        const window = Math.floor(now / (limit.windowMs / 1000));
        const resetTime = (window + 1) * (limit.windowMs / 1000) * 1000;
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        };
      }
      
      // Increment counter
      await client.incr(key);
      await client.expire(key, Math.ceil(limit.windowMs / 1000));
      
      return {
        allowed: true,
        remaining: limit.max - count - 1,
        resetTime: Date.now() + limit.windowMs
      };
      
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow request if rate limiting fails
      return { allowed: true, remaining: 999, resetTime: Date.now() + 60000 };
    }
  }

  // Get rate limit info without incrementing
  async getLimitInfo(identifier, type = 'general') {
    try {
      if (!redisClient.isReady()) {
        return { remaining: 999, resetTime: Date.now() + 60000 };
      }

      const limit = this.defaultLimits[type] || this.defaultLimits.general;
      const key = this.generateKey(identifier, type);
      
      const client = redisClient.getClient();
      const current = await client.get(key);
      const count = current ? parseInt(current) : 0;
      
      const now = Math.floor(Date.now() / 1000);
      const window = Math.floor(now / (limit.windowMs / 1000));
      const resetTime = (window + 1) * (limit.windowMs / 1000) * 1000;
      
      return {
        remaining: Math.max(0, limit.max - count),
        resetTime,
        limit: limit.max,
        windowMs: limit.windowMs
      };
    } catch (error) {
      console.error('Get rate limit info error:', error);
      return { remaining: 999, resetTime: Date.now() + 60000 };
    }
  }

  // Reset rate limit for a specific identifier
  async resetLimit(identifier, type = 'general') {
    try {
      if (!redisClient.isReady()) return false;
      
      const key = this.generateKey(identifier, type);
      const client = redisClient.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Reset rate limit error:', error);
      return false;
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Rate limiting middleware factory
const createRateLimit = (type = 'general', getIdentifier = null) => {
  return async (req, res, next) => {
    try {
      // Get identifier (IP address, user ID, or custom)
      let identifier;
      if (getIdentifier) {
        identifier = getIdentifier(req);
      } else if (req.user && req.user._id) {
        identifier = `user:${req.user._id}`;
      } else {
        identifier = `ip:${req.ip || req.connection.remoteAddress}`;
      }

      // Check rate limit
      const result = await rateLimiter.checkLimit(identifier, type);
      
      if (!result.allowed) {
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': rateLimiter.defaultLimits[type]?.max || 100,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': Math.floor(result.resetTime / 1000),
          'Retry-After': result.retryAfter
        });

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        });
      }

      // Set rate limit headers for successful requests
      res.set({
        'X-RateLimit-Limit': rateLimiter.defaultLimits[type]?.max || 100,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': Math.floor(result.resetTime / 1000)
      });

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Allow request if rate limiting fails
      next();
    }
  };
};

// Specific rate limit middlewares
const rateLimits = {
  // General API rate limiting
  general: createRateLimit('general'),
  
  // Authentication rate limiting
  auth: createRateLimit('auth', (req) => `ip:${req.ip || req.connection.remoteAddress}`),
  
  // Notes rate limiting
  notes: createRateLimit('notes'),
  notesUpload: createRateLimit('notesUpload'),
  
  // Chat rate limiting
  chat: createRateLimit('chat'),
  
  // OCR rate limiting
  ocr: createRateLimit('ocr'),
  
  // Admin rate limiting
  admin: createRateLimit('admin'),
  
  // Public endpoints rate limiting
  public: createRateLimit('public', (req) => `ip:${req.ip || req.connection.remoteAddress}`),
  
  // Custom rate limiting
  custom: (type, getIdentifier) => createRateLimit(type, getIdentifier)
};

// Rate limit info middleware (for getting current limits without incrementing)
const rateLimitInfo = (type = 'general') => {
  return async (req, res, next) => {
    try {
      const identifier = req.user && req.user._id 
        ? `user:${req.user._id}` 
        : `ip:${req.ip || req.connection.remoteAddress}`;
      
      const info = await rateLimiter.getLimitInfo(identifier, type);
      
      res.set({
        'X-RateLimit-Limit': info.limit,
        'X-RateLimit-Remaining': info.remaining,
        'X-RateLimit-Reset': Math.floor(info.resetTime / 1000)
      });
      
      next();
    } catch (error) {
      console.error('Rate limit info middleware error:', error);
      next();
    }
  };
};

// Rate limit reset middleware (for admin use)
const rateLimitReset = (type = 'general') => {
  return async (req, res, next) => {
    try {
      const identifier = req.params.identifier || req.body.identifier;
      if (!identifier) {
        return res.status(400).json({ error: 'Identifier required' });
      }
      
      const success = await rateLimiter.resetLimit(identifier, type);
      
      if (success) {
        res.json({ message: 'Rate limit reset successfully' });
      } else {
        res.status(500).json({ error: 'Failed to reset rate limit' });
      }
    } catch (error) {
      console.error('Rate limit reset middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = {
  rateLimiter,
  rateLimits,
  rateLimitInfo,
  rateLimitReset,
  createRateLimit
}; 