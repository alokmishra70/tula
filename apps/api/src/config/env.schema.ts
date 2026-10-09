import { z } from 'zod';

const csv = z
  .string()
  .default('')
  .transform((value) =>
    value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  );

// Treat `KEY=` in .env files as unset.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const LLM_PROVIDER_NAMES = ['gemini', 'groq', 'mock'] as const;
export type LlmProviderName = (typeof LLM_PROVIDER_NAMES)[number];

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().startsWith('postgres'),
    CORS_ORIGINS: csv,
    // Tried in order; the first healthy provider wins.
    LLM_PROVIDERS: csv.pipe(z.array(z.enum(LLM_PROVIDER_NAMES)).min(1)).default(['mock']),
    GEMINI_API_KEY: optional(z.string()),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    GROQ_API_KEY: optional(z.string()),
    GROQ_MODEL: z.string().default('meta-llama/llama-4-scout-17b-16e-instruct'),
    GROQ_TRANSCRIPTION_MODEL: z.string().default('whisper-large-v3-turbo'),
    STORAGE_DRIVER: z.enum(['local', 'supabase']).default('local'),
    LOCAL_STORAGE_DIR: z.string().default('storage-local'),
    // Base URL clients use to reach this API; local signed URLs point here.
    PUBLIC_API_URL: z.url().default('http://localhost:3000'),
    STORAGE_SIGNING_SECRET: z.string().min(16).default('dev-only-signing-secret'),
    SUPABASE_URL: optional(z.url()),
    SUPABASE_SERVICE_KEY: optional(z.string()),
    SUPABASE_BUCKET: z.string().default('tula-private'),
    BACKGROUND_JOBS: z.stringbool().default(true),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SUPABASE_URL'],
        message: 'SUPABASE_URL and SUPABASE_SERVICE_KEY are required for the supabase driver',
      });
    }
    if (env.NODE_ENV === 'production' && env.STORAGE_SIGNING_SECRET === 'dev-only-signing-secret') {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_SIGNING_SECRET'],
        message: 'Set a real signing secret in production',
      });
    }
    const keys = { gemini: env.GEMINI_API_KEY, groq: env.GROQ_API_KEY } as const;
    for (const provider of env.LLM_PROVIDERS) {
      if (provider !== 'mock' && !keys[provider]) {
        ctx.addIssue({
          code: 'custom',
          path: [`${provider.toUpperCase()}_API_KEY`],
          message: `Required when LLM_PROVIDERS includes ${provider}`,
        });
      }
    }
  });

export type Env = z.infer<typeof EnvSchema>;
