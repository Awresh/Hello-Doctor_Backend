import { Admin } from "../models/index.js";

export class AdminRepository {
    async findByEmail(email) {
        return await Admin.scope('withPassword').findOne({ where: { email } });
    }

    async findById(id) {
        return await Admin.findByPk(id);
    }

    async create(data) {
        return await Admin.create(data);
    }

    async existsByEmail(email) {
        const admin = await Admin.findOne({ where: { email } });
        return !!admin;
    }
}
