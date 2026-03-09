import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z
    .string()
    .default('3000')
    .transform((v) => parseInt(v, 10)),
  CORS_ORIGINS: z.string().transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnv(): AppConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(
      `[Config] Environment validation failed:\n${errors}\nFix the above variables in your .env file.`,
    );
    process.exit(1);
  }
  return result.data;
}
