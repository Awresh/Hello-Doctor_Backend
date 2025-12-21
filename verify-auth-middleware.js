import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { verifyToken } from './src/middleware/auth.middleware.js';
import { Users } from './src/models/user/user.model.js';
import { BusinessType } from './src/models/business/business-type.model.js';
import dotenv from 'dotenv';

dotenv.config();

const DB_URL = process.env.DB_url || 'mongodb+srv://doctordb:doctorDB@cluster0.s4os6.mongodb.net/Hello-Doctor-Dev?retryWrites=true&w=majority&appName=Cluster0';

// Mock Response object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

// Mock Next function
const mockNext = () => {
    return 'next_called';
};

const runVerification = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(DB_URL);
        console.log('Connected to DB.');

        // 1. Create a test user
        console.log('\n--- Setting up Test Data ---');
        let businessType = await BusinessType.findOne({ name: 'Clinic' });
        if (!businessType) {
            businessType = await BusinessType.create({ name: 'Clinic', description: 'Test Clinic' });
        }

        const testEmail = `middleware_test_${Date.now()}@test.com`;
        const user = await Users.create({
            userName: 'Middleware Tester',
            email: testEmail,
            password: 'password123',
            businessName: 'Test Clinic',
            businessType: businessType._id
        });
        console.log('Test User created:', user.email);

        // 2. Test: No Token
        console.log('\n--- Test 1: No Token ---');
        const reqNoToken = { headers: {} };
        const resNoToken = mockRes();
        await verifyToken(reqNoToken, resNoToken, mockNext);

        if (resNoToken.statusCode === 401 && resNoToken.data.message === 'Access denied. No token provided.') {
            console.log('✅ Passed: Correctly rejected request with no token.');
        } else {
            console.error('❌ Failed: Did not handle missing token correctly.', resNoToken);
        }

        // 3. Test: Invalid Token
        console.log('\n--- Test 2: Invalid Token ---');
        const reqInvalidToken = { headers: { authorization: 'Bearer invalid_token_string' } };
        const resInvalidToken = mockRes();
        await verifyToken(reqInvalidToken, resInvalidToken, mockNext);

        if (resInvalidToken.statusCode === 401 && resInvalidToken.data.message === 'Invalid token.') {
            console.log('✅ Passed: Correctly rejected request with invalid token.');
        } else {
            console.error('❌ Failed: Did not handle invalid token correctly.', resInvalidToken);
        }

        // 4. Test: Valid Token
        console.log('\n--- Test 3: Valid Token ---');
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        const reqValidToken = { headers: { authorization: `Bearer ${token}` } };
        const resValidToken = mockRes();
        let nextCalled = false;
        const nextSpy = () => { nextCalled = true; };

        await verifyToken(reqValidToken, resValidToken, nextSpy);

        if (nextCalled && reqValidToken.user && reqValidToken.user._id.toString() === user._id.toString()) {
            console.log('✅ Passed: Correctly verified token and attached user to request.');
            console.log('   Attached User:', reqValidToken.user.email);
        } else {
            console.error('❌ Failed: Did not verify valid token correctly.');
            console.log('   Next Called:', nextCalled);
            console.log('   Req User:', reqValidToken.user);
        }

        // Cleanup
        await Users.deleteOne({ _id: user._id });
        console.log('\nTest User cleaned up.');

    } catch (error) {
        console.error('Verification Script Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB.');
    }
};

runVerification();
