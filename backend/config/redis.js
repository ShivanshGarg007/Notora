const redis = require('redis');

// Maximum delay between reconnection attempts (30 seconds)
const MAX_RECONNECT_DELAY_MS = 30000;

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this._reconnectAttempt = 0;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          // Exponential backoff — retries forever, caps at 30 s
          reconnectStrategy: (retries) => {
            this._reconnectAttempt = retries;
            const delay = Math.min(Math.pow(2, retries) * 100, MAX_RECONNECT_DELAY_MS);
            console.log(
              `🔄 Redis reconnect attempt #${retries + 1} — waiting ${delay}ms before next try`
            );
            return delay;
          }
        }
      });

      this.client.on('error', (err) => {
        // Only log the message; do NOT throw — let reconnectStrategy handle it
        if (this.isConnected) {
          console.error('⚠️  Redis Client Error:', err.message);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        if (this._reconnectAttempt > 0) {
          console.log(`✅ Redis reconnected successfully after ${this._reconnectAttempt} attempt(s)`);
        } else {
          console.log('✅ Redis connected successfully');
        }
        this._reconnectAttempt = 0;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis client ready');
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      // Do NOT throw — caller decides whether to crash or degrade
      console.error('❌ Redis initial connection failed:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // ignore quit errors during shutdown
      }
      this.isConnected = false;
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Lightweight ping to measure Redis round-trip latency.
   * Returns latency in ms, or null if Redis is unavailable.
   */
  async ping() {
    if (!this.isReady()) return null;
    try {
      const start = Date.now();
      await this.client.ping();
      return Date.now() - start;
    } catch {
      return null;
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;