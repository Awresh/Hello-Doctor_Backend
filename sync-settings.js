import dotenv from 'dotenv';
dotenv.config();

import sequelize from './src/config/db.config.js';
import { TimeSettings } from './src/models/settings/time-settings.model.js';
import { SpecialHoliday } from './src/models/settings/special-holiday.model.js';

const syncModels = async () => {
  try {
    console.log('Syncing TimeSettings and SpecialHoliday models...');
    await TimeSettings.sync({ alter: true });
    await SpecialHoliday.sync({ alter: true });
    console.log('Sync completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
};

syncModels();
