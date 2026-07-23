import { z } from 'zod';

const optionalNonEmptyString = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: optionalNonEmptyString,
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ROOM_MESSAGE_RETENTION_DAYS: z.coerce.number().int().min(0).default(90),
  MESSAGE_PURGE_INTERVAL_HOURS: z.coerce.number().int().min(1).default(24),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Config inválida: ${parsed.error.message}`);
  }
  return parsed.data;
}
