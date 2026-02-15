export class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findById(id) {
        return await this.model.findByPk(id);
    }

    async findOne(where) {
        return await this.model.findOne({ where });
    }

    async findAll(where, options = {}) {
        return await this.model.findAll({ where, ...options });
    }

    async create(data, options = {}) {
        return await this.model.create(data, options);
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
