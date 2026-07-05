const redisClient = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
    this.cachePrefixes = {
      NOTES: 'notes:',
      USERS: 'users:',
      AUTH: 'auth:',
      CHAT: 'chat:',
      OCR: 'ocr:',
      SUBJECTS: 'subjects:',
      STATS: 'stats:'
    };
  }

  // Generic cache methods
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!redisClient.isReady()) {
        console.warn('Redis not ready, skipping cache set');
        return false;
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await redisClient.getClient().setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!redisClient.isReady()) {
        return null;
      }

      const value = await redisClient.getClient().get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async delete(key) {
    try {
      if (!redisClient.isReady()) return false;
      await redisClient.getClient().del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      if (!redisClient.isReady()) return false;
      const keys = await redisClient.getClient().keys(pattern);
      if (keys.length > 0) {
        await redisClient.getClient().del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!redisClient.isReady()) return false;
      return await redisClient.getClient().exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Notes specific caching
  async cacheNote(noteId, noteData, ttl = 1800) { // 30 minutes for individual notes
    const key = `${this.cachePrefixes.NOTES}${noteId}`;
    return await this.set(key, noteData, ttl);
  }

  async getCachedNote(noteId) {
    const key = `${this.cachePrefixes.NOTES}${noteId}`;
    return await this.get(key);
  }

  async cacheNotesList(subject, notes, ttl = 900) { // 15 minutes for note lists
    const key = subject 
      ? `${this.cachePrefixes.NOTES}list:${subject}`
      : `${this.cachePrefixes.NOTES}list:all`;
    return await this.set(key, notes, ttl);
  }

  async getCachedNotesList(subject) {
    const key = subject 
      ? `${this.cachePrefixes.NOTES}list:${subject}`
      : `${this.cachePrefixes.NOTES}list:all`;
    return await this.get(key);
  }

  async invalidateNoteCache(noteId) {
    const noteKey = `${this.cachePrefixes.NOTES}${noteId}`;
    const listPattern = `${this.cachePrefixes.NOTES}list:*`;
    
    await this.delete(noteKey);
    await this.deletePattern(listPattern);
  }

  // User specific caching
  async cacheUser(userId, userData, ttl = 3600) { // 1 hour for user data
    const key = `${this.cachePrefixes.USERS}${userId}`;
    return await this.set(key, userData, ttl);
  }

  async getCachedUser(userId) {
    const key = `${this.cachePrefixes.USERS}${userId}`;
    return await this.get(key);
  }

  async invalidateUserCache(userId) {
    const key = `${this.cachePrefixes.USERS}${userId}`;
    return await this.delete(key);
  }

  // Authentication caching
  async cacheAuthToken(token, userData, ttl = 604800) { // 7 days for auth tokens
    const key = `${this.cachePrefixes.AUTH}${token}`;
    return await this.set(key, userData, ttl);
  }

  async getCachedAuthToken(token) {
    const key = `${this.cachePrefixes.AUTH}${token}`;
    return await this.get(key);
  }

  async invalidateAuthToken(token) {
    const key = `${this.cachePrefixes.AUTH}${token}`;
    return await this.delete(key);
  }

  // Chat specific caching
  async cacheChatMessages(roomId, messages, ttl = 1800) { // 30 minutes for chat messages
    const key = `${this.cachePrefixes.CHAT}${roomId}`;
    return await this.set(key, messages, ttl);
  }

  async getCachedChatMessages(roomId) {
    const key = `${this.cachePrefixes.CHAT}${roomId}`;
    return await this.get(key);
  }

  async invalidateChatCache(roomId) {
    const key = `${this.cachePrefixes.CHAT}${roomId}`;
    return await this.delete(key);
  }

  // OCR specific caching
  async cacheOCRResult(imageHash, result, ttl = 86400) { // 24 hours for OCR results
    const key = `${this.cachePrefixes.OCR}${imageHash}`;
    return await this.set(key, result, ttl);
  }

  async getCachedOCRResult(imageHash) {
    const key = `${this.cachePrefixes.OCR}${imageHash}`;
    return await this.get(key);
  }

  // Statistics caching
  async cacheStats(statsType, data, ttl = 3600) { // 1 hour for stats
    const key = `${this.cachePrefixes.STATS}${statsType}`;
    return await this.set(key, data, ttl);
  }

  async getCachedStats(statsType) {
    const key = `${this.cachePrefixes.STATS}${statsType}`;
    return await this.get(key);
  }

  // Cache warming methods
  async warmNotesCache() {
    try {
      const Note = require('../models/Note');
      const notes = await Note.find({ status: 'approved' })
        .populate('uploadedBy', 'name email')
        .limit(100); // Cache first 100 approved notes
      
      await this.cacheNotesList(null, notes);
      console.log('✅ Notes cache warmed');
    } catch (error) {
      console.error('❌ Failed to warm notes cache:', error);
    }
  }

  // Cache health check
  async healthCheck() {
    try {
      if (!redisClient.isReady()) {
        return { status: 'disconnected', message: 'Redis client not ready' };
      }

      const testKey = 'health:test';
      const testValue = { timestamp: Date.now() };
      
      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        return { status: 'healthy', message: 'Cache working correctly' };
      } else {
        return { status: 'unhealthy', message: 'Cache data corruption detected' };
      }
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Cache statistics
  async getCacheStats() {
    try {
      if (!redisClient.isReady()) {
        return { error: 'Redis not connected' };
      }

      const client = redisClient.getClient();
      const info = await client.info('memory');
      
      // Parse Redis info for memory usage
      const memoryLines = info.split('\n').filter(line => line.startsWith('used_memory'));
      const memoryInfo = {};
      
      memoryLines.forEach(line => {
        const [key, value] = line.split(':');
        memoryInfo[key] = value;
      });

      return {
        memory: memoryInfo,
        connected: redisClient.isReady()
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService; 