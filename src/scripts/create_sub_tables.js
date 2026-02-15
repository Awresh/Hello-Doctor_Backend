import 'dotenv/config';
import { sequelize } from '../models/index.js';

async function run() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Creating tables via Raw SQL...');
        const queries = `
            -- Drop existing if any
            DROP TABLE IF EXISTS erp_billing_history;
            DROP TABLE IF EXISTS erp_payment_methods;
            DROP TABLE IF EXISTS erp_subscriptions;
            DROP TABLE IF EXISTS erp_plans;
            
            DROP TYPE IF EXISTS enum_erp_subscriptions_status;
            DROP TYPE IF EXISTS enum_erp_payment_methods_type;
            DROP TYPE IF EXISTS enum_erp_billing_history_status;

            -- Types
            CREATE TYPE enum_erp_subscriptions_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');
            CREATE TYPE enum_erp_payment_methods_type AS ENUM ('Card', 'UPI');
            CREATE TYPE enum_erp_billing_history_status AS ENUM ('paid', 'failed', 'pending');

            -- Plans (ERP specific)
            CREATE TABLE erp_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                "monthlyPrice" DECIMAL(10,2) NOT NULL,
                "yearlyPrice" DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                "maxDoctors" INTEGER DEFAULT 0,
                "maxUsers" INTEGER DEFAULT 0,
                "maxStores" INTEGER DEFAULT 0,
                "maxStaff" INTEGER DEFAULT 0,
                features JSONB,
                "isActive" BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Subscriptions (ERP specific)
            CREATE TABLE erp_subscriptions (
                id SERIAL PRIMARY KEY,
                "tenantId" INTEGER NOT NULL REFERENCES tenants(id),
                "planId" INTEGER NOT NULL REFERENCES erp_plans(id),
                status enum_erp_subscriptions_status DEFAULT 'trialing',
                "billingCycle" VARCHAR(20) DEFAULT 'monthly',
                "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
                "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
                "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Payment Methods (ERP specific)
            CREATE TABLE erp_payment_methods (
                id SERIAL PRIMARY KEY,
                "tenantId" INTEGER NOT NULL REFERENCES tenants(id),
                type enum_erp_payment_methods_type NOT NULL,
                label VARCHAR(100),
                "holderName" VARCHAR(100),
                last4 VARCHAR(4),
                "expiryMonth" VARCHAR(2),
                "expiryYear" VARCHAR(4),
                brand VARCHAR(50),
                "upiId" VARCHAR(100),
                "isPrimary" BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Billing History (ERP specific)
            CREATE TABLE erp_billing_history (
                id SERIAL PRIMARY KEY,
                "tenantId" INTEGER NOT NULL REFERENCES tenants(id),
                "planId" INTEGER NOT NULL REFERENCES erp_plans(id),
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                status enum_erp_billing_history_status DEFAULT 'paid',
                "invoiceDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "transactionId" VARCHAR(100),
                "invoiceUrl" TEXT,
                "paymentMethodDetails" JSONB,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        try {
            await sequelize.query(queries);
            console.log('Executed query successfully.');
        } catch (e) {
            console.log('Query warning/error (might be expected for ENUMs or if tables already exist):', e.message);
        }

        console.log('SQL Creation complete.');

    } catch (e) {
        console.error('SQL Creation failed:', e);
    } finally {
        process.exit();
    }
}

run();
