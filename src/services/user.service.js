import { UserRepository } from "../repositories/user.repository.js";

export class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }

    async findOrCreateUser(userId, userData, transaction) {
        if (userId) {
            return userId;
        }

        const { name, mobile, address, email, age, gender } = userData;

        if (!name || !mobile) {
            throw { statusCode: 400, message: 'User ID or (Name and Mobile) are required to book an appointment.' };
        }

        const existingMobileUser = await this.userRepository.findByMobile(mobile, transaction);
        let user = await this.userRepository.findByNameAndMobile(name, mobile, transaction);

        if (!user) {
            const userType = existingMobileUser ? 'child' : 'parent';
            user = await this.userRepository.create({
                name,
                mobile,
                address,
                email,
                age,
                gender: gender ? gender.toLowerCase() : null,
                type: userType,
                isActive: true
            }, transaction);
        } else {
            let hasUpdates = false;
            if (age) { user.age = age; hasUpdates = true; }
            if (gender) { user.gender = gender.toLowerCase(); hasUpdates = true; }
            if (address) { user.address = address; hasUpdates = true; }
            if (email) { user.email = email; hasUpdates = true; }

            if (hasUpdates) {
                await user.save({ transaction });
            }
        }

        return user.id;
    }

    async updateUser(userId, userData) {
        const { name, mobile, email, age, gender, address } = userData;
        const user = await this.userRepository.findById(userId);
        
        if (!user) return;

        let hasUpdates = false;
        if (name) { user.name = name; hasUpdates = true; }
        if (mobile) { user.mobile = mobile; hasUpdates = true; }
        if (email !== undefined) { user.email = email; hasUpdates = true; }
        if (age) { user.age = age; hasUpdates = true; }
        if (gender) { user.gender = gender.toLowerCase(); hasUpdates = true; }
        if (address !== undefined) { user.address = address; hasUpdates = true; }

        if (hasUpdates) {
            await user.save();
        }
    }

    async searchPatients(searchTerm) {
        if (!searchTerm) return [];
        return await this.userRepository.search(searchTerm);
    }
}
