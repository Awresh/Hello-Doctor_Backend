import { Product, Category, Brand, Unit, Supplier } from "../models/index.js";

export class ProductRepository {
    async findAll(where, include) {
        return await Product.findAll({ where, include });
    }

    async findById(id, include) {
        return await Product.findByPk(id, { include });
    }

    async create(data) {
        return await Product.create(data);
    }

    async update(id, data) {
        return await Product.update(data, { where: { id } });
    }

    async delete(id) {
        return await Product.destroy({ where: { id } });
    }

    async updateStatus(id, status) {
        return await Product.update({ status }, { where: { id } });
    }

    getIncludes() {
        return [
            { model: Category, as: 'category', attributes: ['name', 'id'] },
            { model: Brand, as: 'brand', attributes: ['name', 'id'] },
            { model: Unit, as: 'unit', attributes: ['name', 'id'] },
            { model: Supplier, as: 'supplier', attributes: ['name', 'id'] }
        ];
    }
}
