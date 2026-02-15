import dotenv from 'dotenv';
dotenv.config();
import sequelize from './src/config/db.config.js';

const checkColumns = async () => {
  try {
    const [results, metadata] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'time_settings';
    `);
    console.log('Columns in time_settings:', results.map(r => r.column_name));
    
    const [resultsHol, metadataHol] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'special_holidays';
    `);
    console.log('Columns in special_holidays:', resultsHol.map(r => r.column_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking columns:', error);
    process.exit(1);
  }
};

checkColumns();
