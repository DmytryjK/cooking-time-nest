import { config as dotenvConfig } from 'dotenv';
import ms, { type StringValue } from 'ms';

dotenvConfig();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    url: process.env.REDIS_URL,
  },

  cloudinary: {
    url: process.env.CLOUDINARY_URL,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ||
      '15m') as StringValue,
    accessExpiresMs: ms(
      (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as StringValue,
    ),
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ||
      '7d') as StringValue,
    refreshExpiresMs: ms(
      (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue,
    ),
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  },
};
