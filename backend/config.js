require('dotenv').config();

module.exports = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  app: {
    port: process.env.PORT || 8080,
    env: process.env.NODE_ENV || 'development',
  },
  security: {
    // Add security configurations here
  }
};
