import { Store, Tenant, BusinessType, Admin, TenantUser } from "../models/index.js";

export class AuthStrategy {
    async authenticate(decoded) {
        throw new Error("authenticate method must be implemented");
    }
}

export class StoreAuthStrategy extends AuthStrategy {
    async authenticate(decoded) {
        const store = await Store.findByPk(decoded.storeId, {
            include: [{
                model: Tenant,
                include: [{ model: BusinessType, attributes: ['name'] }]
            }]
        });

        if (!store) {
            throw { statusCode: 401, message: 'Invalid token. Store not found.' };
        }

        return { store, tenant: store.Tenant };
    }
}

export class UserAuthStrategy extends AuthStrategy {
    async authenticate(decoded) {
        const user = await TenantUser.findByPk(decoded.userId, {
            include: [{
                model: Tenant,
                include: [{ model: BusinessType, attributes: ['name'] }]
            }]
        });

        if (!user) {
            throw { statusCode: 401, message: 'Invalid token. User not found.' };
        }

        if (!user.Tenant || !user.Tenant.isActive) {
            throw { statusCode: 401, message: 'Business account is inactive.' };
        }

        return { user, tenant: { ...user.Tenant.toJSON(), userId: user.id } };
    }
}

export class AdminAuthStrategy extends AuthStrategy {
    async authenticate(decoded) {
        const admin = await Admin.findByPk(decoded.adminId);

        if (!admin) {
            throw { statusCode: 401, message: 'Invalid token. Admin not found.' };
        }

        if (!admin.isActive) {
            throw { statusCode: 401, message: 'Admin account is inactive.' };
        }

        return { admin };
    }
}

export class TenantAuthStrategy extends AuthStrategy {
    async authenticate(decoded) {
        const tenant = await Tenant.findByPk(decoded.tenantId, {
            include: [{ model: BusinessType, attributes: ['name'] }]
        });

        if (!tenant) {
            throw { statusCode: 401, message: 'Invalid token. Tenant not found.' };
        }

        return { tenant };
    }
}

export class AuthStrategyFactory {
    static getStrategy(decoded) {
        if (decoded.storeId) return new StoreAuthStrategy();
        if (decoded.userId) return new UserAuthStrategy();
        if (decoded.adminId) return new AdminAuthStrategy();
        if (decoded.tenantId) return new TenantAuthStrategy();
        throw { statusCode: 401, message: 'Invalid token format.' };
    }
}
