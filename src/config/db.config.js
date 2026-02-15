import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false, // Set to console.log to see SQL queries
    benchmark: false,
    databaseVersion: '15.0.0', 
    dialectOptions: {
      connectTimeout: 60000,
      gssencmode: 'disable',
      keepAlive: true,
      statement_timeout: 30000, // 30 second timeout for queries
      idle_in_transaction_session_timeout: 30000
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
      evict: 1000
    },
    retry: {
      max: 3
    }
  }
);

export default sequelize;