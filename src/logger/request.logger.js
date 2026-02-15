import logger from './index.logger.js';

/**
 * Request Logger Middleware
 * 
 * @description
 * Automatically logs incoming HTTP requests and their responses.
 * Captures: Method, URL, Route Pattern, Status, Duration, Body, Query, Params.
 * 
 * @configuration
 * Controlled via .env variables:
 * - LOG_REQ_BODY: 'true' | 'false' - Log request body
 * - LOG_RES_BODY: 'true' | 'false' - Log response body
 * - LOG_RES_BODY_METHODS: 'POST,PUT' - Methods to log response body for
 * - LOG_IGNORE_PATHS: '/health,/favicon.ico' - Paths to ignore
 * 
 * @useCases
 * 1. **API Debugging**: See exactly what data was sent to your API and what it returned.
 *    - Enable `LOG_REQ_BODY=true` and `LOG_RES_BODY=true`.
 * 
 * 2. **Performance Monitoring**: Identify slow endpoints by checking the `duration` field.
 *    - Logs format: `METHOD /url STATUS - DURATIONms`
 * 
 * 3. **Traffic Analysis**: Filter logs by `route` to see usage of specific endpoints.
 *    - Example: `grep "/api/users" logs/application-*.log`
 */
const requestLogger = (req, res, next) => {
  const { method, url, body, query, params } = req;
  const start = Date.now();

  // Check if path should be ignored
  const ignorePaths = (process.env.LOG_IGNORE_PATHS || '').split(',');
  if (ignorePaths.some(path => url.startsWith(path.trim()))) {
    return next();
  }

  // Store original send methods to intercept response body
  const originalSend = res.send;
  const originalJson = res.json;

  let responseBody;

  // Intercept res.send
  res.send = function (body) {
    responseBody = body;
    originalSend.call(this, body);
  };

  // Intercept res.json
  res.json = function (body) {
    responseBody = body;
    originalJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Construct log data
    const logData = {
      method,
      url,
      status: res.statusCode,
      duration: `${duration}ms`,
      route: req.route ? req.route.path : undefined,
      query: Object.keys(query).length ? query : undefined,
      params: Object.keys(params).length ? params : undefined,
    };

    // Conditionally add request body
    if (process.env.LOG_REQ_BODY === 'true' && body && Object.keys(body).length > 0) {
      logData.requestBody = body;
    }

    // Conditionally add response body
    const allowedMethods = (process.env.LOG_RES_BODY_METHODS || '').split(',').map(m => m.trim().toUpperCase());
    const shouldLogResponseBody = process.env.LOG_RES_BODY === 'true' && 
                                  (allowedMethods.includes(method) || allowedMethods.includes('*') || allowedMethods.length === 0 || (allowedMethods.length === 1 && allowedMethods[0] === ''));

    if (shouldLogResponseBody && responseBody) {
      // Try to parse if it's a string that looks like JSON
      try {
        if (typeof responseBody === 'string') {
          logData.responseBody = JSON.parse(responseBody);
        } else {
          logData.responseBody = responseBody;
        }
      } catch (e) {
        logData.responseBody = responseBody;
      }
    }

    // Log based on status code
    const message = `${method} ${url} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
};

export default requestLogger;