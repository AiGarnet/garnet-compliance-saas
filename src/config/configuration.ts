export const configuration = () => ({
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'garnetai',
    url: process.env.DATABASE_URL || 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // CORS configuration
  cors: {
    origin: [
      'https://testinggarnet.netlify.app',
      'https://garnetai.net',
      /\.netlify\.app$/,
      /\.garnetai\.net$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false,
  },

  // Rate limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000, // 1 minute
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100, // 100 requests
  },

  // Compliance data
  compliance: {
    dataPath: process.env.COMPLIANCE_DATA_PATH || './data_new.json',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
  },
}); 