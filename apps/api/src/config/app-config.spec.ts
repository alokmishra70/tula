import { AppConfig } from './app-config';

describe('AppConfig', () => {
  it('parses and defaults values', () => {
    const config = AppConfig.fromEnv({
      DATABASE_URL: 'postgresql://localhost/tula',
      CORS_ORIGINS: 'http://a.test, http://b.test',
    });
    expect(config.port).toBe(3000);
    expect(config.corsOrigins).toEqual(['http://a.test', 'http://b.test']);
  });

  it('requires API keys for configured providers', () => {
    expect(() =>
      AppConfig.fromEnv({
        DATABASE_URL: 'postgresql://localhost/tula',
        LLM_PROVIDERS: 'gemini,groq',
      }),
    ).toThrow(/GEMINI_API_KEY/);
    const config = AppConfig.fromEnv({
      DATABASE_URL: 'postgresql://localhost/tula',
      LLM_PROVIDERS: 'gemini,mock',
      GEMINI_API_KEY: 'k',
    });
    expect(config.ai.providers).toEqual(['gemini', 'mock']);
    expect(config.ai.groq).toBeNull();
  });

  it('fails fast on invalid configuration', () => {
    expect(() => AppConfig.fromEnv({ DATABASE_URL: 'mysql://x' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
