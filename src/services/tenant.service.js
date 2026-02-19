import { TenantRepository } from "../repositories/tenant.repository.js";

export class TenantService {
    constructor() {
        this.tenantRepository = new TenantRepository();
    }

    async getTenantProfile(tenantId) {
        const tenant = await this.tenantRepository.findById(tenantId);
        if (!tenant) {
            throw { statusCode: 404, message: "Tenant not found" };
        }
        return tenant;
    }

    async updateTenantProfile(tenantId, data) {
        const tenant = await this.tenantRepository.findById(tenantId, false);
        if (!tenant) {
            throw { statusCode: 404, message: "Tenant not found" };
        }

        const { name, businessName, businessTypeId, whatsappApiUrl, whatsappApiKey, whatsappInstanceId, whatsappEnabled } = data;
        await this.tenantRepository.update(tenant, { 
            name, 
            businessName, 
            businessTypeId, 
            whatsappApiUrl, 
            whatsappApiKey, 
            whatsappInstanceId, 
            whatsappEnabled 
        });

        return await this.tenantRepository.findById(tenantId);
    }

    async getLicenseUsage(tenantId) {
        const tenant = await this.tenantRepository.findByIdWithSubscription(tenantId);
        if (!tenant) {
            throw { statusCode: 404, message: "Tenant not found" };
        }

        const activePlan = tenant.Subscription?.Plan;

        const limits = {
            maxRoles: tenant.customMaxRoles ?? activePlan?.maxRoles ?? tenant.BusinessType?.maxRoles ?? 0,
            maxUsers: tenant.customMaxUsers ?? activePlan?.maxUsers ?? tenant.BusinessType?.maxUsers ?? 0,
            maxStores: tenant.customMaxStores ?? activePlan?.maxStores ?? tenant.BusinessType?.maxStores ?? 0,
            maxDoctors: tenant.customMaxDoctors ?? activePlan?.maxDoctors ?? tenant.BusinessType?.maxDoctors ?? 0,
            maxStaff: tenant.customMaxStaff ?? activePlan?.maxStaff ?? tenant.BusinessType?.maxStaff ?? 0,
            whatsappCredits: tenant.whatsappCredits || 0
        };

        const [rolesCount, storesCount, usersCount, doctorsCount, staffCount] = await Promise.all([
            this.tenantRepository.countRoles(tenantId),
            this.tenantRepository.countStores(tenantId),
            this.tenantRepository.countUsers(tenantId),
            this.tenantRepository.countDoctors(tenantId),
            this.tenantRepository.countStaff(tenantId)
        ]);

        return {
            limits,
            usage: {
                roles: rolesCount,
                stores: storesCount,
                users: usersCount,
                doctors: doctorsCount,
                staff: staffCount
            }
        };
    }
}
