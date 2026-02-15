import { User } from "../models/index.js";
import { Op } from "sequelize";

export class UserRepository {
    async findByMobile(mobile, transaction) {
        return await User.findOne({ where: { mobile }, transaction });
    }

    async findByNameAndMobile(name, mobile, transaction) {
        return await User.findOne({ where: { name, mobile }, transaction });
    }

    async create(data, transaction) {
        return await User.create(data, { transaction });
    }

    async findById(id) {
        return await User.findByPk(id);
    }

    async search(searchTerm) {
        return await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${searchTerm}%` } },
                    { mobile: { [Op.iLike]: `%${searchTerm}%` } }
                ]
            },
            limit: 20
        });
    }
}
