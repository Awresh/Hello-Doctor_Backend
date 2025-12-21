// Mongoose import removed
// Adapting for Sequelize based on `tenent.user.model.js`
import { TenantUser } from './src/models/tenant/tenent.user.model.js';
import sequelize from './src/config/db.config.js';

const GRANT_ALL_PERMISSIONS = [
    {
        key: 'inventory',
        name: 'Inventory',
        access: true,
        tabs: [
            { key: 'products', name: 'Products & Services', actions: ['read', 'create', 'update', 'delete'] },
            { key: 'stores', name: 'Stores', actions: ['read', 'create', 'update', 'delete'] },
            { key: 'brands', name: 'Brands', actions: ['read', 'create', 'update', 'delete'] },
            { key: 'units', name: 'Units', actions: ['read', 'create', 'update', 'delete'] },
            { key: 'categories', name: 'Categories', actions: ['read', 'create', 'update', 'delete'] }
        ]
    },
    // Add User Global Access too?
    {
        key: 'users',
        name: 'Users',
        access: true,
        tabs: [
            { key: 'users', name: 'User Management', actions: ['read', 'create', 'update', 'delete'] }
        ]
    }
];

async function migratePermissions() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const users = await TenantUser.findAll();
        console.log(`Found ${users.length} users to check.`);

        let updatedCount = 0;
        for (const user of users) {
            const currentPermissions = user.permissions || [];

            // Check if permissions are empty or undefined
            if (!currentPermissions || currentPermissions.length === 0) {
                console.log(`Updating permissions for user: ${user.name} (${user.id})`);
                user.permissions = GRANT_ALL_PERMISSIONS;
                // user.changed('permissions', true); // Ensure Sequelize detects the change if it's JSON
                await user.save();
                updatedCount++;
            } else {
                console.log(`User ${user.name} already has permissions. Skipping.`);
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} users.`);
        process.exit(0);

    } catch (error) {
        console.error('Unable to connect to the database or Migration failed:', error);
        process.exit(1);
    }
}

migratePermissions();
