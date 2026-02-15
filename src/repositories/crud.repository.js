export class CrudRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(where, include = []) {
        return await this.model.findAll({ where, include });
    }

    async findById(id, include = []) {
        return await this.model.findByPk(id, { include });
    }

    async create(data) {
        return await this.model.create(data);
    }

    async update(id, data) {
        return await this.model.update(data, { where: { id } });
    }

    async delete(id) {
        return await this.model.destroy({ where: { id } });
    }

    async count(where) {
        return await this.model.count({ where });
    }
}
