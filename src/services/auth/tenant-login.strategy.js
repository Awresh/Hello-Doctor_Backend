import { LoginStrategy } from './login-strategy.interface.js';
import { Tenant, BusinessType } from '../../models/index.js';

export class TenantLoginStrategy extends LoginStrategy {
    async authenticate(email, password) {
        const tenant = await Tenant.scope('withPassword').findOne({ 
            where: { email },
            include: [{ model: BusinessType, attributes: ['name', 'id'] }]
        });
        
        if (!tenant) return null;
        
        const isPasswordValid = await tenant.comparePassword(password);
        if (!isPasswordValid) return null;
        
        return tenant;
    }

    async formatResponse(tenant, token) {
        const tenantResponse = tenant.toJSON();
        delete tenantResponse.password;
        
        return {
            tenant: { ...tenantResponse, role: 'admin' },
            token,
            businessType: tenantResponse.BusinessType,
            tenantId: tenant.id,
            vendorType: tenantResponse.BusinessType?.name?.toLowerCase()
        };
    }
}
