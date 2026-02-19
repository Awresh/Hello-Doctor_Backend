export class AuthValidator {
    validateLogin(data) {
        const { email, password } = data;
        if (!email || !password) {
            throw { statusCode: 400, message: 'Email and password are required' };
        }
    }

    validateRegister(data) {
        const { name, email, businessName, businessType, password } = data;
        if (!name || !email || !businessName || !businessType || !password) {
            throw { statusCode: 400, message: 'All required fields must be provided' };
        }
    }

    validateEmail(data) {
        const { email } = data;
        if (!email) {
            throw { statusCode: 400, message: 'Email is required' };
        }
    }

    validateForgotPassword(data) {
        const { email } = data;
        if (!email) {
            throw { statusCode: 400, message: 'Email is required' };
        }
    }

    validateResetPassword(data) {
        const { token, password } = data;
        if (!token || !password) {
            throw { statusCode: 400, message: 'Token and new password are required' };
        }
        if (password.length < 6) {
            throw { statusCode: 400, message: 'Password must be at least 6 characters long' };
        }
    }
}
