import { LoginStrategy } from './login-strategy.interface.js';
import { TenantUser, Tenant, BusinessType } from '../../models/index.js';

export class TenantUserLoginStrategy extends LoginStrategy {
    async authenticate(email, password) {
        const user = await TenantUser.scope('withPassword').findOne({
            where: { email },
            include: [{ 
                model: Tenant,
                include: [{ model: BusinessType, attributes: ['name', 'id'] }]
            }]
        });

        if (!user) return null;
        
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) return null;

        if (!user.Tenant || !user.Tenant.isActive) {
            throw { statusCode: 401, message: 'Business account is inactive' };
        }
        
        return user;
    }

    async formatResponse(user, token) {
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        return {
            tenant: {
                ...userResponse,
                tenantId: user.tenantId,
                BusinessType: user.Tenant.BusinessType
            },
            token,
            businessType: user.Tenant.BusinessType,
            tenantId: user.tenantId,
            vendorType: user.Tenant.BusinessType?.name?.toLowerCase()
        };
    }
}
