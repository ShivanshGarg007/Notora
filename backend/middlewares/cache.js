const cacheService = require('../utils/cache');

// Middleware to check cache before processing request
const checkCache = (cacheKey, ttl = 900) => {
  return async (req, res, next) => {
    try {
      // Skip cache in development if needed
      if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CACHE === 'true') {
        return next();
      }

      const key = typeof cacheKey === 'function' ? cacheKey(req) : cacheKey;
      const cachedData = await cacheService.get(key);

      if (cachedData) {
        console.log(`📦 Cache hit for key: ${key}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cachedAt: new Date().toISOString()
        });
      }

      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        // Restore original method
        res.json = originalSend;
        
        // Cache the response
        if (data && !data.error) {
          cacheService.set(key, data, ttl).then(() => {
            console.log(`💾 Cached response for key: ${key}`);
          }).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        
        // Send response
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Middleware to invalidate cache after certain operations
const invalidateCache = (cacheKeys) => {
  return async (req, res, next) => {
    try {
      // Store original send method
      const originalSend = res.json;
      
      // Override send method to invalidate cache after successful response
      res.json = function(data) {
        // Restore original method
        res.json = originalSend;
        
        // Invalidate cache if operation was successful
        if (data && !data.error) {
          const keysToInvalidate = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
          
          Promise.all(keysToInvalidate.map(key => {
            const finalKey = typeof key === 'function' ? key(req, data) : key;
            return cacheService.deletePattern(finalKey);
          })).then(() => {
            console.log(`🗑️ Invalidated cache keys: ${keysToInvalidate.join(', ')}`);
          }).catch(err => {
            console.error('Cache invalidation error:', err);
          });
        }
        
        // Send response
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

// Specific cache keys for different routes
const cacheKeys = {
  // Notes
  notesList: (req) => {
    const subject = req.query.subject;
    return subject ? `notes:list:${subject}` : 'notes:list:all';
  },
  
  noteById: (req) => `notes:${req.params.id}`,
  
  // Users
  userProfile: (req) => `users:${req.user || req.params.id}`,
  
  // Chat
  chatMessages: (req) => `chat:${req.params.roomId || req.body.room}`,
  
  // OCR
  ocrResult: (req) => {
    const imageHash = req.body.imageHash || req.params.imageHash;
    return `ocr:${imageHash}`;
  }
};

// Cache invalidation patterns
const invalidationPatterns = {
  notesList: 'notes:list:*',
  noteById: (req) => `notes:${req.params.id}`,
  userProfile: (req) => `users:${req.user || req.params.id}`,
  chatMessages: (req) => `chat:${req.params.roomId || req.body.room}`,
  allNotes: 'notes:*',
  allUsers: 'users:*'
};

module.exports = {
  checkCache,
  invalidateCache,
  cacheKeys,
  invalidationPatterns
}; 