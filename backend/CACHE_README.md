# Redis Caching Implementation for Notora

## Overview

This implementation adds Redis caching to the Notora application to significantly improve performance by reducing database queries and API response times. The caching system is designed to be transparent, efficient, and easy to manage.

## 🚀 Performance Benefits

- **Faster Response Times**: Cached data is served in milliseconds instead of database query times
- **Reduced Database Load**: Fewer queries to MongoDB, especially for frequently accessed data
- **Better User Experience**: Faster page loads and smoother interactions
- **Scalability**: Handles increased traffic without proportional database load increase
- **Cost Optimization**: Reduces database costs and improves resource utilization

## 📊 Cached Data Types

### 1. Notes Data
- **Individual Notes**: Cached for 30 minutes
- **Notes Lists**: Cached for 15 minutes (by subject or all notes)
- **Cache Keys**: `notes:{noteId}`, `notes:list:{subject}`, `notes:list:all`

### 2. User Data
- **User Profiles**: Cached for 1 hour
- **Authentication Tokens**: Cached for 7 days
- **Cache Keys**: `users:{userId}`, `auth:{token}`

### 3. Chat Messages
- **Room Messages**: Cached for 30 minutes
- **Cache Keys**: `chat:{roomId}`

### 4. OCR Results
- **Image Processing Results**: Cached for 24 hours
- **Cache Keys**: `ocr:{imageHash}`

### 5. Statistics
- **App Statistics**: Cached for 1 hour
- **Cache Keys**: `stats:{statType}`

## 🛠️ Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For production, use your Redis service URL
# REDIS_URL=redis://username:password@host:port

# Optional: Disable cache in development
DISABLE_CACHE=false
```

### 2. Install Dependencies

Redis is already included in your `package.json`. If you need to install it manually:

```bash
npm install redis
```

### 3. Start Redis Server

**Local Development:**
```bash
# On Windows (using WSL or Docker)
docker run -d -p 6379:6379 redis:alpine

# On macOS
brew install redis
brew services start redis

# On Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

**Production:**
- Use a managed Redis service (Redis Cloud, AWS ElastiCache, etc.)
- Set the `REDIS_URL` environment variable

## 🔧 Usage

### Automatic Caching

The caching is implemented transparently in your controllers:

```javascript
// Notes are automatically cached when fetched
const notes = await getAllNotes(); // Checks cache first, then database

// User data is cached on login/registration
const user = await getCurrentUser(); // Returns cached data if available
```

### Manual Cache Management

```javascript
const cacheService = require('./utils/cache');

// Cache data manually
await cacheService.set('custom:key', data, 3600); // 1 hour TTL

// Retrieve cached data
const data = await cacheService.get('custom:key');

// Delete specific cache
await cacheService.delete('custom:key');

// Delete cache by pattern
await cacheService.deletePattern('notes:*');
```

### Cache Middleware

Use the provided middleware for automatic caching:

```javascript
const { checkCache, invalidateCache, cacheKeys } = require('./middleware/cache');

// Apply cache check middleware
router.get('/notes', checkCache(cacheKeys.notesList), getAllNotes);

// Apply cache invalidation middleware
router.post('/notes', invalidateCache('notes:*'), createNote);
```

## 📈 Monitoring and Management

### 1. Cache Health Check

```bash
# Check cache health via API
curl http://localhost:5000/api/cache/health

# Get cache statistics
curl http://localhost:5000/api/cache/stats
```

### 2. Cache Manager Script

Use the interactive cache manager:

```bash
# Interactive mode
node scripts/cacheManager.js

# Command line mode
node scripts/cacheManager.js stats
node scripts/cacheManager.js clear "notes:*"
node scripts/cacheManager.js warm
node scripts/cacheManager.js list "users:*"
```

**Available Commands:**
- `stats` - Show cache statistics and health
- `clear [pattern]` - Clear cache (default: all)
- `warm` - Warm up cache with frequently accessed data
- `list [pattern]` - List cache keys
- `info <key>` - Get detailed information about a specific key
- `monitor` - Monitor Redis commands in real-time

### 3. Cache Warming

The system automatically warms the cache:
- **On Startup**: Loads frequently accessed notes
- **Scheduled**: Every 6 hours in production
- **Manual**: Use the cache manager script

## 🔍 Cache Hit Indicators

Cached responses include metadata:

```json
{
  "data": [...],
  "_cached": true,
  "_cachedAt": "2024-01-15T10:30:00.000Z"
}
```

## ⚡ Performance Optimization Tips

### 1. Cache Key Strategy
- Use descriptive, hierarchical keys: `notes:list:java`
- Include user context when needed: `users:123:notes`
- Use consistent naming conventions

### 2. TTL (Time To Live) Optimization
- **Short TTL** (15-30 min): Frequently changing data
- **Medium TTL** (1-6 hours): Moderately changing data
- **Long TTL** (24 hours+): Static or rarely changing data

### 3. Cache Invalidation
- Invalidate related caches when data changes
- Use pattern-based invalidation for efficiency
- Consider cache warming after bulk operations

### 4. Memory Management
- Monitor Redis memory usage
- Set appropriate `maxmemory` policies
- Use `maxmemory-policy allkeys-lru` for automatic eviction

## 🚨 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```
   ❌ Redis connection failed: connect ECONNREFUSED
   ```
   **Solution**: Ensure Redis server is running and `REDIS_URL` is correct

2. **Cache Not Working**
   ```
   📦 Cache hit for key: notes:123
   ```
   **Solution**: Check if `DISABLE_CACHE=true` is set in development

3. **Memory Issues**
   ```
   ⚠️ Cache health check failed: Memory limit exceeded
   ```
   **Solution**: Increase Redis memory or implement eviction policies

### Debug Mode

Enable detailed logging:

```javascript
// In your .env file
NODE_ENV=development
DEBUG_CACHE=true
```

### Health Check

```bash
# Check if Redis is responding
redis-cli ping

# Check Redis info
redis-cli info memory

# Monitor Redis commands
redis-cli monitor
```

## 📊 Performance Metrics

Monitor these metrics to optimize caching:

1. **Cache Hit Rate**: Percentage of requests served from cache
2. **Response Time**: Average response time with/without cache
3. **Memory Usage**: Redis memory consumption
4. **Eviction Rate**: How often data is evicted due to memory limits

## 🔒 Security Considerations

1. **Redis Security**
   - Use authentication in production
   - Bind Redis to localhost in development
   - Use SSL/TLS for remote connections

2. **Data Privacy**
   - Don't cache sensitive user data
   - Implement proper cache invalidation on user logout
   - Use appropriate TTL for different data types

3. **Access Control**
   - Restrict cache management endpoints to admins
   - Log cache operations for audit trails

## 🚀 Production Deployment

### 1. Redis Configuration

```bash
# Production Redis configuration
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 2. Environment Variables

```env
REDIS_URL=redis://username:password@your-redis-host:6379
NODE_ENV=production
DISABLE_CACHE=false
```

### 3. Monitoring

Set up monitoring for:
- Redis memory usage
- Cache hit rates
- Response times
- Error rates

### 4. Backup Strategy

- Configure Redis persistence (RDB/AOF)
- Set up automated backups
- Test recovery procedures

## 📚 Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [Node.js Redis Client](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/topics/memory-optimization)
- [Caching Strategies](https://redis.io/topics/patterns)

## 🤝 Contributing

When adding new cached data:

1. Add appropriate cache keys to `cachePrefixes`
2. Implement cache check and invalidation logic
3. Add cache warming if needed
4. Update this documentation
5. Add tests for cache functionality

---

**Note**: This caching implementation is designed to be transparent to your existing code. The system gracefully handles Redis connection failures and falls back to database queries when needed. 