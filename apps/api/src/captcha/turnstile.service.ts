import {
  ForbiddenException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { APP_CONFIG } from '../config/config.module';
import type { AppConfig } from '../config/env';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

@Injectable()
export class TurnstileService {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async verify(token: string): Promise<void> {
    if (this.config.NODE_ENV === 'test') return;

    let response: Response;
    try {
      response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: this.config.TURNSTILE_SECRET_KEY,
            response: token,
          }),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'CAPTCHA service unavailable, please retry',
      );
    }

    let data: TurnstileResponse;
    try {
      data = (await response.json()) as TurnstileResponse;
    } catch {
      throw new ServiceUnavailableException(
        'CAPTCHA service unavailable, please retry',
      );
    }

    if (!data.success) {
      throw new ForbiddenException('CAPTCHA verification failed');
    }
  }
}
