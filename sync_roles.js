import { sequelize, Role } from './src/models/index.js';

const syncRole = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync Role model (creates table if not exists)
        await Role.sync({ alter: true });
        console.log('Role table synced successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database or sync:', error);
        process.exit(1);
    }
};

syncRole();
