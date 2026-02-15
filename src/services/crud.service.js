export class CrudService {
    constructor(repository) {
        this.repository = repository;
    }

    async getAll(where, include = []) {
        return await this.repository.findAll(where, include);
    }

    async getById(id, include = []) {
        const item = await this.repository.findById(id, include);
        if (!item) throw { statusCode: 404, message: 'Item not found' };
        return item;
    }

    async create(data) {
        return await this.repository.create(data);
    }

    async update(id, data) {
        const [count] = await this.repository.update(id, data);
        if (count === 0) throw { statusCode: 404, message: 'Item not found' };
        return await this.repository.findById(id, []);
    }

    async delete(id) {
        const count = await this.repository.delete(id);
        if (count === 0) throw { statusCode: 404, message: 'Item not found' };
    }
}
