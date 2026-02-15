import { CrudRepository } from "../repositories/crud.repository.js";
import { CrudService } from "./crud.service.js";
import { Category, Unit, Supplier, Store, Customer, Make } from "../models/index.js";
import { Op } from "sequelize";
import { getJsonValue } from "../utils/WebUtils.js";

export class CategoryService extends CrudService {
    constructor() {
        super(new CrudRepository(Category));
    }

    async getAllWithPermissions(tenantId, storeData) {
        let whereClause = { tenantId, isActive: true, type: 'Product' };
        
        if (storeData) {
            whereClause = {
                tenantId,
                isActive: true,
                [Op.or]: [{ storeId: storeData.id }, { storeId: null }]
            };
        }

        const categories = await Category.findAll({
            where: whereClause,
            include: [{ model: Category, as: 'parentCategory', attributes: ['name'] }]
        });

        return categories.map(category => {
            const categoryObj = category.toJSON();
            const canEdit = storeData ? (categoryObj.storeId === storeData.id) : true;
            return { ...categoryObj, showAction_Edit: canEdit, showAction_View: false, showAction_Delete: canEdit, showAction_Toggle: canEdit };
        });
    }

    async createWithStore(data, tenantId, storeData) {
        const existing = await Category.findOne({ where: { name: data.name, tenantId } });
        if (existing) throw new Error("Category already exists");

        if (data.parentCategory) {
            const parent = await Category.findByPk(data.parentCategory);
            if (!parent) throw new Error("Parent category not found");
        }

        let categoryData = { name: data.name, description: data.description, parentCategoryId: data.parentCategory || null, tenantId };

        if (getJsonValue(storeData, 'id')) {
            const store = await Store.findByPk(getJsonValue(storeData, 'id'));
            if (!store) throw new Error("Store not found");
            categoryData.storeId = store.id;
        }

        const category = await Category.create(categoryData);
        const fetched = await Category.findByPk(category.id, {
            include: [{ model: Category, as: 'parentCategory', attributes: ['name'] }]
        });

        const getCat = fetched.toJSON();
        return { ...getCat, parentCategory: getCat.parentCategory ?? null, showAction_Edit: true, showAction_View: false, showAction_Delete: true, showAction_Toggle: true };
    }

    async updateWithPermissions(id, data, storeData) {
        if (data.parentCategory) {
            const parent = await Category.findByPk(data.parentCategory);
            if (!parent) throw new Error("Parent category not found");
            if (data.parentCategory === id) throw new Error("Category cannot be its own parent");
        }

        const category = await Category.findByPk(id);
        if (!category) throw new Error("Category not found");

        if (storeData && (!category.storeId || category.storeId != storeData.id)) {
            throw new Error("You do not have permission to edit this category");
        }

        await category.update({ name: data.name, description: data.description, parentCategoryId: data.parentCategory || null });
        const fetched = await Category.findByPk(id, {
            include: [{ model: Category, as: 'parentCategory', attributes: ['name'] }]
        });

        const getCat = fetched.toJSON();
        return { ...getCat, parentCategory: getCat.parentCategory ?? null, showAction_Edit: true, showAction_View: false, showAction_Delete: true, showAction_Toggle: true };
    }

    async deleteWithPermissions(id, storeData) {
        const category = await Category.findByPk(id);
        if (!category) throw new Error("Category not found");

        if (storeData && (!category.storeId || category.storeId != storeData.id)) {
            throw new Error("You do not have permission to delete this category");
        }

        await category.update({ isActive: false });
    }

    async toggleStatus(id, isActive) {
        const category = await Category.findByPk(id);
        if (!category) throw new Error("Category not found");

        await category.update({ isActive });
        const fetched = await Category.findByPk(id, {
            include: [{ model: Category, as: 'parentCategory', attributes: ['name'] }]
        });

        const getCat = fetched.toJSON();
        return { ...getCat, parentCategory: getCat.parentCategory ?? null, showAction_Edit: true, showAction_View: false, showAction_Delete: true, showAction_Toggle: true };
    }
}

export class UnitService extends CrudService {
    constructor() {
        super(new CrudRepository(Unit));
    }
}

export class SupplierService extends CrudService {
    constructor() {
        super(new CrudRepository(Supplier));
    }
}

export class StoreService extends CrudService {
    constructor() {
        super(new CrudRepository(Store));
    }
}

export class CustomerService extends CrudService {
    constructor() {
        super(new CrudRepository(Customer));
    }
}

export class MakeService extends CrudService {
    constructor() {
        super(new CrudRepository(Make));
    }
}
