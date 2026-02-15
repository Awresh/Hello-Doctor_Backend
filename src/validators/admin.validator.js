export class AdminValidator {
    validateLogin(data) {
        const { email, password } = data;
        
        if (!email || !password) {
            throw { statusCode: 400, message: 'Email and password are required' };
        }
    }

    validateRegister(data) {
        const { name, email, password } = data;
        
        if (!name || !email || !password) {
            throw { statusCode: 400, message: 'Name, email, and password are required' };
        }
    }
}
