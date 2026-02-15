export class LoginStrategy {
    async authenticate(email, password) {
        throw new Error('authenticate method must be implemented');
    }

    async formatResponse(user, token) {
        throw new Error('formatResponse method must be implemented');
    }
}
