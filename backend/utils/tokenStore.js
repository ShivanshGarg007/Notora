// Simple in-memory store for token blacklisting
class TokenStore {
  constructor() {
    this.store = new Map();
    console.log("Using in-memory token store");
  }

  async setEx(key, ttl, value) {
    this.store.set(key, value);
    setTimeout(() => this.store.delete(key), ttl * 1000);
    return true;
  }

  async get(key) {
    return this.store.get(key);
  }

  async quit() {
    this.store.clear();
    return true;
  }
}

// Create a single instance of the token store
const tokenStore = new TokenStore();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Clearing token store...');
  await tokenStore.quit();
  process.exit(0);
});

module.exports = tokenStore; 