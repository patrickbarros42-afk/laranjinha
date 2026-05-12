import "dotenv/config";

import { z } from "zod";

const requiredSecret = (name: string) =>
  z
    .string()
    .min(1)
    .refine(
      (value) => !/^(cole_|preencher|your-|sua_|seu_)/i.test(value),
      `${name} must be a real value, not a placeholder`
    );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  APP_TIMEZONE: z.string().default("America/Sao_Paulo"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  SUPABASE_URL: z
    .string()
    .url()
    .refine((url) => !url.includes("/rest/v1"), "Use the Supabase project root URL without /rest/v1"),
  SUPABASE_SERVICE_ROLE_KEY: requiredSecret("SUPABASE_SERVICE_ROLE_KEY"),
  OPENAI_API_KEY: requiredSecret("OPENAI_API_KEY"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  ZAPI_BASE_URL: z.string().url().default("https://api.z-api.io"),
  ZAPI_INSTANCE_ID: requiredSecret("ZAPI_INSTANCE_ID"),
  ZAPI_INSTANCE_TOKEN: requiredSecret("ZAPI_INSTANCE_TOKEN"),
  ZAPI_CLIENT_TOKEN: requiredSecret("ZAPI_CLIENT_TOKEN")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment variables: ${details}`);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(",").map((origin) => origin.trim())
};
