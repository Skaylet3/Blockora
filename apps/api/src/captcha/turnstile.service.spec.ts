import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TurnstileService } from './turnstile.service';
import { APP_CONFIG } from '../config/config.module';

const mockConfig = {
  TURNSTILE_SECRET_KEY: 'test-secret-key',
};

describe('TurnstileService', () => {
  let service: TurnstileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnstileService,
        { provide: APP_CONFIG, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TurnstileService>(TurnstileService);
    vi.restoreAllMocks();
  });

  it('should succeed when Cloudflare returns success: true', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    } as Response);

    await expect(service.verify('valid-token')).resolves.toBeUndefined();
  });

  it('should throw ForbiddenException when Cloudflare returns success: false', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
    } as Response);

    await expect(service.verify('invalid-token')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ServiceUnavailableException when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'));

    await expect(service.verify('any-token')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('should throw ServiceUnavailableException when response is not valid JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.reject(new Error('invalid json')),
    } as Response);

    await expect(service.verify('any-token')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('should send correct parameters to Cloudflare', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    } as Response);

    await service.verify('my-token');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const body = fetchSpy.mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get('secret')).toBe('test-secret-key');
    expect(body.get('response')).toBe('my-token');
  });
});
