import { z } from 'zod';
import { EnvSchema, type Env, type LlmProviderName } from './env.schema';

export type StorageConfig =
  | { driver: 'local'; directory: string; publicApiUrl: string; signingSecret: string }
  | { driver: 'supabase'; url: string; serviceKey: string; bucket: string };

export interface AiConfig {
  providers: LlmProviderName[];
  gemini: { apiKey: string; model: string } | null;
  groq: { apiKey: string; model: string; transcriptionModel: string } | null;
}

export class AppConfig {
  readonly nodeEnv: Env['NODE_ENV'];
  readonly port: number;
  readonly logLevel: Env['LOG_LEVEL'];
  readonly databaseUrl: string;
  readonly corsOrigins: string[];
  readonly ai: AiConfig;
  readonly storage: StorageConfig;
  readonly backgroundJobs: boolean;

  private constructor(env: Env) {
    this.nodeEnv = env.NODE_ENV;
    this.port = env.PORT;
    this.logLevel = env.LOG_LEVEL;
    this.databaseUrl = env.DATABASE_URL;
    this.corsOrigins = env.CORS_ORIGINS;
    this.ai = {
      providers: env.LLM_PROVIDERS,
      gemini: env.GEMINI_API_KEY ? { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL } : null,
      groq: env.GROQ_API_KEY
        ? {
            apiKey: env.GROQ_API_KEY,
            model: env.GROQ_MODEL,
            transcriptionModel: env.GROQ_TRANSCRIPTION_MODEL,
          }
        : null,
    };
    this.storage = AppConfig.storageFrom(env);
    this.backgroundJobs = env.BACKGROUND_JOBS;
  }

  private static storageFrom(env: Env): StorageConfig {
    if (env.STORAGE_DRIVER === 'supabase') {
      return {
        driver: 'supabase',
        url: env.SUPABASE_URL!,
        serviceKey: env.SUPABASE_SERVICE_KEY!,
        bucket: env.SUPABASE_BUCKET,
      };
    }
    return {
      driver: 'local',
      directory: env.LOCAL_STORAGE_DIR,
      publicApiUrl: env.PUBLIC_API_URL.replace(/\/$/, ''),
      signingSecret: env.STORAGE_SIGNING_SECRET,
    };
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  static fromEnv(source: NodeJS.ProcessEnv): AppConfig {
    const parsed = EnvSchema.safeParse(source);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
    }
    return new AppConfig(parsed.data);
  }
}
