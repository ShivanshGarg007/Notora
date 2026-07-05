# Rate Limiting Implementation

This document describes the comprehensive rate limiting system implemented in the Notora application to protect against abuse and ensure fair usage.

## Overview

The rate limiting system uses Redis to track request counts and enforce different limits for different endpoints and user types. It provides:

- **Per-endpoint rate limiting** with different limits for different API endpoints
- **User-based and IP-based tracking** depending on authentication status
- **Configurable limits** for different types of operations
- **Admin monitoring and management** tools
- **Automatic cleanup** of expired rate limit data

## Rate Limit Types

### 1. General API (`general`)
- **Limit**: 100 requests per 15 minutes
- **Scope**: All authenticated API requests
- **Tracking**: User ID or IP address

### 2. Authentication (`auth`)
- **Limit**: 5 attempts per 15 minutes
- **Scope**: Login, register, and logout endpoints
- **Tracking**: IP address only (prevents brute force attacks)

### 3. Notes (`notes`)
- **Limit**: 30 requests per minute
- **Scope**: Note retrieval and management
- **Tracking**: User ID

### 4. Note Uploads (`notesUpload`)
- **Limit**: 3 uploads per minute
- **Scope**: Note upload and update operations
- **Tracking**: User ID

### 5. Chat (`chat`)
- **Limit**: 50 messages per minute
- **Scope**: Chat message retrieval and sending
- **Tracking**: User ID

### 6. OCR (`ocr`)
- **Limit**: 10 OCR requests per minute
- **Scope**: OCR processing endpoints
- **Tracking**: User ID

### 7. Admin (`admin`)
- **Limit**: 100 requests per minute
- **Scope**: Admin-only operations
- **Tracking**: User ID

### 8. Public (`public`)
- **Limit**: 60 requests per minute
- **Scope**: Public endpoints (no authentication required)
- **Tracking**: IP address

## Implementation Details

### Rate Limiter Class

The `RateLimiter` class in `middleware/rateLimit.js` provides:

```javascript
class RateLimiter {
  // Check if request is within rate limit
  async checkLimit(identifier, type = 'general')
  
  // Get rate limit info without incrementing
  async getLimitInfo(identifier, type = 'general')
  
  // Reset rate limit for a specific identifier
  async resetLimit(identifier, type = 'general')
}
```

### Key Generation

Rate limit keys are generated using the pattern:
```
ratelimit:{type}:{identifier}:{window}
```

Where:
- `type`: The rate limit type (e.g., 'auth', 'notes')
- `identifier`: User ID or IP address
- `window`: Time window identifier (prevents key collisions)

### Middleware Usage

Rate limiting is applied using middleware:

```javascript
// Apply to specific route
router.post('/login', rateLimits.auth, loginHandler);

// Apply to route group
router.use('/api/notes', rateLimits.notes);
```

## API Endpoints

### Rate Limit Information

#### Get Current Rate Limit Info
```
GET /api/rate-limit/info/:type?
```
Returns current rate limit status for the requesting user/IP.

**Response:**
```json
{
  "type": "general",
  "limit": 100,
  "windowMs": 900000,
  "remaining": 95,
  "resetTime": 1640995200
}
```

#### Get Rate Limit Configuration
```
GET /api/rate-limit/config
```
Returns all rate limit types and their configurations.

**Response:**
```json
{
  "limits": {
    "general": { "windowMs": 900000, "max": 100 },
    "auth": { "windowMs": 900000, "max": 5 }
  },
  "description": {
    "general": "General API requests",
    "auth": "Authentication attempts"
  }
}
```

### Admin Management (Admin Only)

#### Get Rate Limit Statistics
```
GET /api/rate-limit/admin/stats
```
Returns comprehensive statistics about all active rate limits.

**Response:**
```json
{
  "totalKeys": 150,
  "stats": {
    "auth": {
      "ip:192.168.1.1": 3,
      "ip:192.168.1.2": 1
    },
    "notes": {
      "user:507f1f77bcf86cd799439011": 25
    }
  },
  "summary": [
    {
      "type": "auth",
      "activeIdentifiers": 2,
      "totalRequests": 4
    }
  ]
}
```

#### Reset Specific Rate Limit
```
POST /api/rate-limit/admin/reset
Content-Type: application/json

{
  "identifier": "user:507f1f77bcf86cd799439011",
  "type": "notes"
}
```

#### Reset All Rate Limits for Type
```
POST /api/rate-limit/admin/reset/:type
```

#### Reset All Rate Limits
```
POST /api/rate-limit/admin/reset-all
```

#### Get Rate Limit Info for Specific Identifier
```
GET /api/rate-limit/admin/info/:identifier/:type?
```

## Frontend Integration

### Rate Limit Monitor Component

The `RateLimitMonitor` component provides admins with:

- **Real-time statistics** of all rate limits
- **Per-type breakdown** of active limits and request counts
- **Individual identifier tracking** with reset capabilities
- **Configuration display** showing current limits
- **Bulk reset operations** for emergency situations

### Usage in Admin Dashboard

The rate limit monitor is integrated into the admin dashboard with a tab-based interface:

```jsx
<AdminDashboard>
  <TabNavigation>
    <Tab name="notes">Notes Management</Tab>
    <Tab name="rate-limits">Rate Limits</Tab>
  </TabNavigation>
  
  {activeTab === 'rate-limits' && <RateLimitMonitor />}
</AdminDashboard>
```

## Error Handling

### Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

With HTTP headers:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 45
```

### Graceful Degradation

If Redis is unavailable:
- Rate limiting is bypassed (requests are allowed)
- Warning logs are generated
- Application continues to function normally

## Configuration

### Environment Variables

No additional environment variables are required. The system uses the existing Redis connection.

### Customizing Limits

To modify rate limits, update the `defaultLimits` object in `middleware/rateLimit.js`:

```javascript
this.defaultLimits = {
  general: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  // Add or modify limits here
};
```

### Adding New Rate Limit Types

1. Add the new type to `defaultLimits`
2. Create a new middleware function:
   ```javascript
   const customLimit = createRateLimit('customType');
   ```
3. Apply to routes:
   ```javascript
   router.post('/custom-endpoint', customLimit, handler);
   ```

## Monitoring and Maintenance

### Health Checks

The rate limiting system includes built-in health checks:

- **Redis connectivity** verification
- **Key expiration** monitoring
- **Memory usage** tracking

### Cleanup

Rate limit keys automatically expire based on their window size. No manual cleanup is required.

### Performance Considerations

- **Redis operations** are minimal (get, incr, expire)
- **Key expiration** is handled automatically by Redis
- **Memory usage** is predictable and bounded
- **Network overhead** is minimal

## Security Considerations

### Protection Against

- **Brute force attacks** on authentication endpoints
- **API abuse** and excessive requests
- **Resource exhaustion** through rapid requests
- **DDoS-like behavior** from individual users

### Limitations

- **IP-based tracking** can be bypassed with proxies
- **User-based tracking** requires authentication
- **Rate limits** are per-instance (not distributed across multiple servers)

## Troubleshooting

### Common Issues

1. **Rate limits not working**
   - Check Redis connectivity
   - Verify middleware is applied to routes
   - Check console logs for errors

2. **Incorrect limit counts**
   - Clear Redis cache: `redis-cli FLUSHALL`
   - Check for multiple server instances
   - Verify key generation logic

3. **Admin endpoints not accessible**
   - Verify admin middleware is applied
   - Check user role permissions
   - Ensure proper authentication

### Debug Commands

```bash
# Check Redis rate limit keys
redis-cli KEYS "ratelimit:*"

# Get specific rate limit count
redis-cli GET "ratelimit:auth:ip:192.168.1.1:1234567890"

# Clear all rate limits
redis-cli KEYS "ratelimit:*" | xargs redis-cli DEL
```

## Future Enhancements

### Planned Features

1. **Distributed rate limiting** across multiple server instances
2. **Dynamic rate limit adjustment** based on server load
3. **Rate limit analytics** and reporting
4. **Whitelist/blacklist** functionality
5. **Rate limit notifications** for admins

### Integration Opportunities

- **Logging systems** for rate limit events
- **Alerting systems** for unusual patterns
- **Analytics platforms** for usage insights
- **Load balancers** for distributed enforcement 