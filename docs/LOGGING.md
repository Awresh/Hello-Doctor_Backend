# Logging System Documentation

This project uses a robust, custom logging system built with `winston`. It supports daily log rotation, multiple log levels, source location tracking, and advanced request logging middleware.

## 1. Configuration (`.env`)

Control the logger's behavior using these environment variables:

```env
# General
LOG_LEVEL=debug           # info, debug, warn, error
LOG_DIR=logs              # Directory to store log files
LOG_TO_FILE=true          # Set to false to disable file logging

# Request Middleware
LOG_REQ_BODY=true         # Log the request body (payload)
LOG_RES_BODY=true         # Log the response body
LOG_RES_BODY_METHODS=POST,PUT,DELETE # Only log response body for these methods
LOG_IGNORE_PATHS=/favicon.ico,/health # Paths to exclude from logging
```

## 2. Usage

### Importing the Logger

```javascript
const logger = require('./src/logger/index.logger');
```

### Log Levels

Use different methods based on the severity of the event:

```javascript
// 1. Info: General operational events
logger.info('Server started on port 3000');

// 2. Debug: Detailed information for debugging
logger.debug('User authentication attempt', { userId: '123' });

// 3. Warn: Non-critical issues
logger.warn('Rate limit approached', { ip: '127.0.0.1' });

// 4. Error: Critical failures
try {
  // ... code that might fail
} catch (error) {
  logger.error('Database connection failed', { error: error.message, stack: error.stack });
}
```

### Source Location Tracking

The logger automatically captures the file name, line number, and function name where the log was called.

**Output Example:**
```
2025-11-29 12:00:00 [INFO] [auth.service.js:45 loginUser]: User logged in successfully
```

## 3. Middleware (Auto-Detection)

The `requestLogger` middleware is automatically applied in `server.js`. It logs every incoming API request.

**What it logs:**
- **Method & URL**: `POST /api/users`
- **Route Pattern**: `/api/users/:id` (helps group metrics)
- **Status & Duration**: `200 - 45ms`
- **Data**: Request Body, Query Params, Route Params
- **Response**: Response Body (configurable)

**Example Log Entry:**
```json
{
  "level": "info",
  "message": "POST /api/users 201 - 120ms",
  "method": "POST",
  "url": "/api/users",
  "route": "/api/users",
  "status": 201,
  "duration": "120ms",
  "requestBody": {
    "username": "john_doe",
    "email": "john@example.com"
  },
  "responseBody": {
    "id": "user_123",
    "success": true
  }
}
```

## 4. Use Cases

### Case 1: Debugging a Failed API Call
**Scenario**: A user reports that creating an account fails.
**Action**:
1. Check `logs/application-YYYY-MM-DD.log`.
2. Search for `POST /api/register`.
3. You will see the **Request Body** (what they sent) and the **Response Body** (the error returned).
4. If there was a server error, check `logs/error-YYYY-MM-DD.log` for the stack trace.

### Case 2: Performance Monitoring
**Scenario**: The app feels slow.
**Action**:
1. Check the logs for high duration values (e.g., `duration: "1500ms"`).
2. The log entry will show exactly which API endpoint is slow.

### Case 3: Auditing
**Scenario**: You need to know who deleted a resource.
**Action**:
1. Search for `DELETE` requests in the logs.
2. The log will show the URL (e.g., `/api/products/55`) and the timestamp.

## 5. Log Files

- **`logs/application-YYYY-MM-DD.log`**: Contains ALL logs (Info, Debug, Error). Use this for general debugging.
- **`logs/error-YYYY-MM-DD.log`**: Contains ONLY Error logs. Use this to quickly find critical issues.
