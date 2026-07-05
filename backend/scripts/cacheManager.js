const redisClient = require('../config/redis');
const cacheService = require('../utils/cache');
const mongoose = require('mongoose');
require('dotenv').config();

class CacheManager {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      await redisClient.connect();
      this.isConnected = true;
      console.log('✅ Connected to MongoDB and Redis');
    } catch (error) {
      console.error('❌ Connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await redisClient.disconnect();
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB and Redis');
    }
  }

  async getCacheStats() {
    try {
      const stats = await cacheService.getCacheStats();
      const health = await cacheService.healthCheck();
      
      console.log('\n📊 Cache Statistics:');
      console.log('==================');
      console.log(`Status: ${health.status}`);
      console.log(`Message: ${health.message}`);
      
      if (stats.memory) {
        console.log('\nMemory Usage:');
        Object.entries(stats.memory).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
      
      return { stats, health };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return null;
    }
  }

  async clearCache(pattern = '*') {
    try {
      console.log(`🗑️ Clearing cache with pattern: ${pattern}`);
      const result = await cacheService.deletePattern(pattern);
      
      if (result) {
        console.log('✅ Cache cleared successfully');
      } else {
        console.log('❌ Failed to clear cache');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      return false;
    }
  }

  async warmCache() {
    try {
      console.log('🔥 Warming up cache...');
      await cacheService.warmNotesCache();
      console.log('✅ Cache warming completed');
      return true;
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      return false;
    }
  }

  async listCacheKeys(pattern = '*') {
    try {
      if (!redisClient.isReady()) {
        console.log('❌ Redis not connected');
        return [];
      }

      const client = redisClient.getClient();
      const keys = await client.keys(pattern);
      
      console.log(`\n🔑 Cache Keys (${keys.length} found):`);
      console.log('==================');
      
      if (keys.length === 0) {
        console.log('No keys found');
        return [];
      }

      // Group keys by prefix
      const groupedKeys = {};
      keys.forEach(key => {
        const prefix = key.split(':')[0];
        if (!groupedKeys[prefix]) {
          groupedKeys[prefix] = [];
        }
        groupedKeys[prefix].push(key);
      });

      Object.entries(groupedKeys).forEach(([prefix, keyList]) => {
        console.log(`\n${prefix}: (${keyList.length} keys)`);
        keyList.slice(0, 10).forEach(key => {
          console.log(`  - ${key}`);
        });
        if (keyList.length > 10) {
          console.log(`  ... and ${keyList.length - 10} more`);
        }
      });

      return keys;
    } catch (error) {
      console.error('❌ Error listing cache keys:', error);
      return [];
    }
  }

  async getKeyInfo(key) {
    try {
      if (!redisClient.isReady()) {
        console.log('❌ Redis not connected');
        return null;
      }

      const client = redisClient.getClient();
      const exists = await client.exists(key);
      
      if (!exists) {
        console.log(`❌ Key '${key}' does not exist`);
        return null;
      }

      const ttl = await client.ttl(key);
      const type = await client.type(key);
      
      console.log(`\n🔍 Key Information: ${key}`);
      console.log('==================');
      console.log(`Type: ${type}`);
      console.log(`TTL: ${ttl === -1 ? 'No expiration' : `${ttl} seconds`}`);
      
      if (type === 'string') {
        const value = await client.get(key);
        try {
          const parsed = JSON.parse(value);
          console.log('Value: (JSON object)');
          console.log(JSON.stringify(parsed, null, 2));
        } catch {
          console.log(`Value: ${value}`);
        }
      }

      return { exists, ttl, type };
    } catch (error) {
      console.error('❌ Error getting key info:', error);
      return null;
    }
  }

  async monitorCache() {
    try {
      console.log('👀 Starting cache monitoring...');
      console.log('Press Ctrl+C to stop\n');

      const client = redisClient.getClient();
      
      // Monitor Redis commands
      const monitor = client.monitor();
      
      monitor.on('data', (data) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${data}`);
      });

      monitor.on('error', (error) => {
        console.error('❌ Monitor error:', error);
      });

    } catch (error) {
      console.error('❌ Error starting monitor:', error);
    }
  }

  async showHelp() {
    console.log(`
🔧 Cache Manager - Available Commands:
=====================================

1. stats                    - Show cache statistics and health
2. clear [pattern]          - Clear cache (default: all)
3. warm                     - Warm up cache with frequently accessed data
4. list [pattern]           - List cache keys (default: all)
5. info <key>               - Get detailed information about a specific key
6. monitor                  - Monitor Redis commands in real-time
7. help                     - Show this help message
8. exit                     - Exit the cache manager

Examples:
  node cacheManager.js stats
  node cacheManager.js clear "notes:*"
  node cacheManager.js list "users:*"
  node cacheManager.js info "notes:123"
    `);
  }

  async runCommand(command, args = []) {
    switch (command) {
      case 'stats':
        await this.getCacheStats();
        break;
        
      case 'clear':
        const pattern = args[0] || '*';
        await this.clearCache(pattern);
        break;
        
      case 'warm':
        await this.warmCache();
        break;
        
      case 'list':
        const listPattern = args[0] || '*';
        await this.listCacheKeys(listPattern);
        break;
        
      case 'info':
        const key = args[0];
        if (!key) {
          console.log('❌ Please provide a key name');
          break;
        }
        await this.getKeyInfo(key);
        break;
        
      case 'monitor':
        await this.monitorCache();
        break;
        
      case 'help':
        await this.showHelp();
        break;
        
      case 'exit':
        console.log('👋 Goodbye!');
        await this.disconnect();
        process.exit(0);
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        await this.showHelp();
        break;
    }
  }

  async interactive() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🔧 Cache Manager - Interactive Mode');
    console.log('Type "help" for available commands\n');

    const askQuestion = () => {
      rl.question('cache> ', async (input) => {
        const [command, ...args] = input.trim().split(' ');
        
        if (command) {
          await this.runCommand(command, args);
        }
        
        askQuestion();
      });
    };

    askQuestion();
  }
}

// Main execution
async function main() {
  const cacheManager = new CacheManager();
  
  try {
    await cacheManager.connect();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Interactive mode
      await cacheManager.interactive();
    } else {
      // Command line mode
      const [command, ...commandArgs] = args;
      await cacheManager.runCommand(command, commandArgs);
      await cacheManager.disconnect();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await cacheManager.disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = CacheManager; 