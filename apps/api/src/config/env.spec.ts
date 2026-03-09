import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateEnv } from './env';

describe('validateEnv', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const validEnv = {
    DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/db',
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long!',
    CORS_ORIGINS: 'http://localhost:5173',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    NODE_ENV: 'test',
  };

  beforeEach(() => {
    originalEnv = { ...process.env };
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: number | string | null) => {
        throw new Error(`process.exit called with code ${_code}`);
      });
  });

  afterEach(() => {
    process.env = originalEnv;
    exitSpy.mockRestore();
  });

  it('returns a valid AppConfig when all required variables are set', () => {
    process.env = { ...validEnv };

    const config = validateEnv();

    expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(config.JWT_SECRET).toBe(validEnv.JWT_SECRET);
    expect(config.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(config.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    expect(config.PORT).toBe(3000);
    expect(config.CORS_ORIGINS).toEqual(['http://localhost:5173']);
    expect(config.NODE_ENV).toBe('test');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('applies defaults for optional variables', () => {
    process.env = { ...validEnv };
    delete process.env.PORT;
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;

    const config = validateEnv();

    expect(config.PORT).toBe(3000);
    expect(config.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(config.JWT_REFRESH_EXPIRES_IN).toBe('7d');
  });

  it('splits CORS_ORIGINS by comma', () => {
    process.env = {
      ...validEnv,
      CORS_ORIGINS: 'http://localhost:5173,http://localhost:3000',
    };

    const config = validateEnv();

    expect(config.CORS_ORIGINS).toEqual([
      'http://localhost:5173',
      'http://localhost:3000',
    ]);
  });

  it('exits when DATABASE_URL is missing', () => {
    process.env = { ...validEnv };
    delete process.env.DATABASE_URL;

    expect(() => validateEnv()).toThrow('process.exit called');
  });

  it('exits when DATABASE_URL is not a valid URL', () => {
    process.env = { ...validEnv, DATABASE_URL: 'not-a-url' };

    expect(() => validateEnv()).toThrow('process.exit called');
  });

  it('exits when JWT_SECRET is missing', () => {
    process.env = { ...validEnv };
    delete process.env.JWT_SECRET;

    expect(() => validateEnv()).toThrow('process.exit called');
  });

  it('exits when JWT_SECRET is shorter than 32 characters', () => {
    process.env = { ...validEnv, JWT_SECRET: 'short' };

    expect(() => validateEnv()).toThrow('process.exit called');
  });

  it('exits when NODE_ENV is an invalid value', () => {
    process.env = { ...validEnv, NODE_ENV: 'staging' };

    expect(() => validateEnv()).toThrow('process.exit called');
  });

  it('exits when CORS_ORIGINS is missing', () => {
    process.env = { ...validEnv };
    delete process.env.CORS_ORIGINS;

    expect(() => validateEnv()).toThrow('process.exit called');
  });
});
