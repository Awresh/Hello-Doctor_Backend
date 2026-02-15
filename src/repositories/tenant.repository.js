import { Tenant, BusinessType, Subscription, Plan, Role, Store, TenantUser } from "../models/index.js";

export class TenantRepository {
    async findById(tenantId, includeBusinessType = true) {
        const options = { where: { id: tenantId } };
        if (includeBusinessType) {
            options.include = [{ model: BusinessType, attributes: ['name'] }];
        }
        return await Tenant.findByPk(tenantId, options);
    }

    async findByIdWithSubscription(tenantId) {
        return await Tenant.findByPk(tenantId, {
            include: [
                { model: BusinessType },
                { 
                    model: Subscription, 
                    where: { status: 'active' }, 
                    required: false,
                    include: [{ model: Plan }]
                }
            ]
        });
    }

    async update(tenant, data) {
        return await tenant.update(data);
    }

    async countRoles(tenantId) {
        return await Role.count({ where: { tenantId, isActive: true } });
    }

    async countStores(tenantId) {
        return await Store.count({ where: { tenantId, isActive: true } });
    }

    async countUsers(tenantId) {
        return await TenantUser.count({ where: { tenantId } });
    }

    async countDoctors(tenantId) {
        return await TenantUser.count({ where: { tenantId, isDoctor: true } });
    }

    async countStaff(tenantId) {
        return await TenantUser.count({ where: { tenantId, isDoctor: false } });
    }
}
