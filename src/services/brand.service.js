import { CrudRepository } from "../repositories/crud.repository.js";
import { CrudService } from "./crud.service.js";
import { Brand } from "../models/index.js";
import { Op } from "sequelize";

export class BrandService extends CrudService {
    constructor() {
        super(new CrudRepository(Brand));
    }

    async getAllBrands(tenantId, storeData) {
        let whereClause = { tenantId, isActive: true };
        if (storeData) {
            whereClause = {
                tenantId,
                isActive: true,
                [Op.or]: [{ storeId: storeData.id }, { storeId: null }]
            };
        }

        const brands = await this.repository.findAll(whereClause);
        return brands.map(brand => this.formatBrand(brand, storeData));
    }

    formatBrand(brand, storeData) {
        const brandObj = brand.toJSON();
        const isStoreProduct = storeData ? (brandObj.storeId?.toString() === storeData.id?.toString()) : true;
        return {
            ...brandObj,
            showAction_Edit: isStoreProduct,
            showAction_View: isStoreProduct,
            showAction_Delete: isStoreProduct,
            showAction_Toggle: isStoreProduct
        };
    }

    async createBrand(data, tenantId, storeData) {
        const { name, description } = data;
        
        const existing = await Brand.findOne({ 
            where: { tenantId, name: { [Op.iLike]: name } } 
        });

        if (existing) {
            throw { statusCode: 400, message: "Brand already exists" };
        }

        const brandData = { name, description, tenantId };
        if (storeData) brandData.storeId = storeData.id;

        const brand = await this.repository.create(brandData);
        return this.formatBrand(await this.repository.findById(brand.id, []), storeData);
    }

    async updateBrand(id, data, storeData) {
        const brand = await this.repository.findById(id, []);
        if (!brand) throw { statusCode: 404, message: "Brand not found" };

        if (storeData && (!brand.storeId || brand.storeId != storeData.id)) {
            throw { statusCode: 403, message: "You do not have permission to edit this brand" };
        }

        await brand.update(data);
        return this.formatBrand(brand, storeData);
    }

    async deleteBrand(id, storeData) {
        const brand = await this.repository.findById(id, []);
        if (!brand) throw { statusCode: 404, message: "Brand not found" };

        if (storeData && (!brand.storeId || brand.storeId != storeData.id)) {
            throw { statusCode: 403, message: "You do not have permission to delete this brand" };
        }

        await brand.update({ isActive: false });
    }

    async toggleBrandStatus(id, isActive) {
        const brand = await this.repository.findById(id, []);
        if (!brand) throw { statusCode: 404, message: "Brand not found" };
        
        await brand.update({ isActive });
        return this.formatBrand(brand, null);
    }
}
