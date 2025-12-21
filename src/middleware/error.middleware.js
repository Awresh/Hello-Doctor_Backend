import logger from '../logger/index.logger.js';

/**
 * Error Handling Middleware
 * 
 * @description
 * Catches all errors thrown in the application and logs them with full request context.
 * Logs: Method, URL, Route, Body, Query, Params, Error Message, Stack Trace.
 * 
 * @configuration
 * Uses the same LOG_REQ_BODY env variable as requestLogger.
 * 
 * @useCases
 * 1. **Debugging Failed Requests**: See exactly what request caused the error.
 * 2. **Production Error Tracking**: Full context for reproducing issues.
 * 3. **Security Auditing**: Track malicious payloads that cause errors.
 */
const errorMiddleware = (err, req, res, next) => {
  const { method, url, body, query, params } = req;
  
  // Construct detailed error log with request context
  const errorContext = {
    method,
    url,
    route: req.route ? req.route.path : undefined,
    query: Object.keys(query).length ? query : undefined,
    params: Object.keys(params).length ? params : undefined,
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack
    }
  };

  // Conditionally add request body (respects LOG_REQ_BODY setting)
  if (process.env.LOG_REQ_BODY === 'true' && body && Object.keys(body).length > 0) {
    errorContext.requestBody = body;
  }

  // Log error with full context
  logger.error(`Error in ${method} ${url}: ${err.message}`, errorContext);

  // Send appropriate response based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }) // Only show stack in development
  });
};

export default errorMiddleware;