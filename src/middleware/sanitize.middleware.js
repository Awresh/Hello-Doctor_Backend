export const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/[<>]/g, '');
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    if (req.body) req.body = sanitize(req.body);
    if (req.query) {
        for (const key in req.query) {
            req.query[key] = sanitize(req.query[key]);
        }
    }
    if (req.params) {
        for (const key in req.params) {
            req.params[key] = sanitize(req.params[key]);
        }
    }
    
    next();
};
