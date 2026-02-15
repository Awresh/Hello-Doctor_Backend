import { AdminRepository } from "../repositories/admin.repository.js";
import { JwtService } from "./jwt.service.js";

export class AdminService {
    constructor() {
        this.adminRepository = new AdminRepository();
        this.jwtService = new JwtService();
    }

    async login(email, password) {
        const admin = await this.adminRepository.findByEmail(email);
        
        if (!admin) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        if (!admin.isActive) {
            throw { statusCode: 401, message: 'Account is inactive' };
        }

        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            throw { statusCode: 401, message: 'Invalid credentials' };
        }

        const token = this.jwtService.generateToken({ adminId: admin.id, type: admin.type });
        
        const adminResponse = { ...admin.toJSON() };
        delete adminResponse.password;

        return { admin: adminResponse, token };
    }

    async register(data) {
        const { name, email, mobile, password, type } = data;

        const exists = await this.adminRepository.existsByEmail(email);
        if (exists) {
            throw { statusCode: 400, message: 'Admin already exists with this email' };
        }

        const admin = await this.adminRepository.create({
            name,
            email,
            mobile,
            password,
            type: type || 'subadmin'
        });

        const token = this.jwtService.generateToken({ adminId: admin.id, type: admin.type });
        const adminResponse = await this.adminRepository.findById(admin.id);

        return { admin: adminResponse, token };
    }
}
