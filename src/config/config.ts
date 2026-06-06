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

  ytdlp: {
    timeoutMs: Number(process.env.YTDLP_TIMEOUT_MS) || 120_000,
    retryCount: Number(process.env.YTDLP_RETRY_COUNT) || 4,
    retryDelayMs: Number(process.env.YTDLP_RETRY_DELAY_MS) || 500,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.2,
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS) || 8192,
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS) || 60_000,
  },

  unsplash: {
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
    timeoutMs: Number(process.env.UNSPLASH_TIMEOUT_MS) || 10_000,
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

  google: {
    clientId: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  },

  googleRedirectUrl: process.env.GOOGLE_REDIRECT_URL,
};
