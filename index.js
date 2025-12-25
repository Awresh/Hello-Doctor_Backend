import 'dotenv/config';
import server from './src/server.js';
import { sequelize, setupAssociations } from './src/models/index.js';
import logger from './src/logger/index.logger.js';

const PORT = process.env.PORT || 3000;

server.listen(PORT, async() => {
    logger.info(`Server running on port ${PORT}`);
    
    try {
        // Setup model associations
        setupAssociations();
        
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');
        
        // Sync database (create tables if they don't exist)
        // verify that the table doesn't already exist
        await sequelize.sync({ alter: true }); 
        logger.info('Database synchronized successfully.');
        logger.info('Database synchronized successfully.');
        
    } catch (error) {
        logger.error('Unable to connect to the database:', error.message);
        logger.error('Server will continue running, but database operations will fail.');
        logger.error('Please check your database credentials in .env file.');
    }
});