import jwt from 'jsonwebtoken';

export class UnifiedLoginService {
    constructor(strategies = []) {
        this.strategies = strategies;
    }

    addStrategy(strategy) {
        this.strategies.push(strategy);
    }

    generateToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    }

    async login(email, password) {
        for (const strategy of this.strategies) {
            const user = await strategy.authenticate(email, password);
            
            if (user) {
                const tokenPayload = user.tenantId 
                    ? { userId: user.id, tenantId: user.tenantId, role: user.role }
                    : { tenantId: user.id };
                
                const token = this.generateToken(tokenPayload);
                return await strategy.formatResponse(user, token);
            }
        }
        
        throw { statusCode: 401, message: 'Invalid credentials' };
    }
}
