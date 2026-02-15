import jwt from "jsonwebtoken";

export class JwtService {
    generateToken(payload, expiresIn = '24h') {
        return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn });
    }

    verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET || 'secret');
    }
}
