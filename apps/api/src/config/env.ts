import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // AI Models
  NEMOCLAW_ENDPOINT: z.string().default('http://localhost:8080'),
  NEMOTRON_SUPER_MODEL: z.string().default('nemotron-3-super-120b-a12b'),
  NEMOTRON_CASCADE_MODEL: z.string().default('nemotron-cascade-2-30b-a3b'),
  MODEL_TIMEOUT_MS: z.coerce.number().default(30000),

  // Privacy Router
  PRIVACY_ROUTER_ENABLED: z.coerce.boolean().default(false),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).default('change-me-32-byte-hex-key-for-field-encryption'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error('Environment validation failed:');
    console.error(JSON.stringify(formatted, null, 2));
    process.exit(1);
  }

  return result.data;
}
