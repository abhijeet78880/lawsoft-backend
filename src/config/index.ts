// Config loader: validates process.env using Zod and exports a typed config object.

import dotenv from 'dotenv';
import { z } from 'zod';
import { en } from 'zod/locales';

dotenv.config();

// Schema for environment variables (coerce numeric values where appropriate)
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default('30d'),

  // AWS / S3 (optional in development)
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),

  // Payments
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Video / third-party
  VIDEO_PROVIDER_API_KEY: z.string().optional(),
  VIDEO_PROVIDER_SECRET: z.string().optional(),

  // SMTP (for sending emails, OTPs)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(), // 'true' or 'false'
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // Misc
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  CORS_ORIGIN: z.string().optional(),

  // AI Model 
  AI_INFERENCE_ENDPOINT: z.string().url().optional(),
  AI_MODEL_NAME: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),

  // Resend (email service)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Collect readable errors
  const formatted = parsed.error.format();
  // Throw with helpful message so process crashes early in CI / dev
  throw new Error(`Invalid environment variables:\n${JSON.stringify(formatted, null, 2)}`);
}

// Build a friendly typed config object for the app
export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwt: {
    accessToken: {
      secret: parsed.data.JWT_ACCESS_TOKEN_SECRET,
      expiry: parsed.data.JWT_ACCESS_TOKEN_EXPIRY,
    },
    refreshToken: {
      secret: parsed.data.JWT_REFRESH_TOKEN_SECRET,
      expiry: parsed.data.JWT_REFRESH_TOKEN_EXPIRY,
    },
  },
  aws: {
    s3: {
      bucket: parsed.data.S3_BUCKET,
      endpoint: parsed.data.S3_ENDPOINT,
      region: parsed.data.S3_REGION,
      accessKeyId: parsed.data.S3_ACCESS_KEY,
      secretAccessKey: parsed.data.S3_SECRET_KEY,
    },
  },
  payments: {
    razorpay: {
      keyId: parsed.data.RAZORPAY_KEY_ID,
      keySecret: parsed.data.RAZORPAY_KEY_SECRET,
    },
    stripe: {
      secretKey: parsed.data.STRIPE_SECRET_KEY,
      webhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
    },
  },
  video: {
    apiKey: parsed.data.VIDEO_PROVIDER_API_KEY,
    secret: parsed.data.VIDEO_PROVIDER_SECRET,
  },
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    secure: parsed.data.SMTP_SECURE === 'true' ? true : false,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.SMTP_FROM,
  },
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    max: parsed.data.RATE_LIMIT_MAX,
  },
  aiModels: {
    inferenceEndpoint: parsed.data.AI_INFERENCE_ENDPOINT,
    modelName: parsed.data.AI_MODEL_NAME,
    githubToken: parsed.data.GITHUB_TOKEN,
  },
  resend: {
    apiKey: parsed.data.RESEND_API_KEY,
    from: parsed.data.RESEND_FROM_EMAIL,
  },
  cors: {
    origin: parsed.data.CORS_ORIGIN,
  },
  logLevel: parsed.data.LOG_LEVEL,
};

export type Config = typeof config;

export default config;
