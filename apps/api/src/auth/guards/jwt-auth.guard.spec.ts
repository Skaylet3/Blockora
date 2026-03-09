import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: { verifyAccessToken: ReturnType<typeof vi.fn> };
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { verifyAccessToken: vi.fn() };
    reflector = { getAllAndOverride: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();

    guard = module.get(JwtAuthGuard);
  });

  function createMockContext(authHeader?: string): ExecutionContext {
    const request = { headers: {} as Record<string, string>, user: undefined };
    if (authHeader !== undefined) {
      request.headers['authorization'] = authHeader;
    }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as unknown as ExecutionContext;
  }

  it('allows access and attaches user when Bearer token is valid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const payload = { sub: 'user-1', email: 'a@b.com' };
    authService.verifyAccessToken.mockReturnValue(payload);
    const ctx = createMockContext('Bearer valid-token');

    expect(guard.canActivate(ctx)).toBe(true);
    expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token');

    const req = ctx.switchToHttp().getRequest() as any;
    expect(req.user).toEqual(payload);
  });

  it('bypasses authentication when route is marked @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockContext(); // no auth header

    expect(guard.canActivate(ctx)).toBe(true);
    expect(authService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when Authorization header is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext();

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Authorization header is not Bearer', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext('Basic abc123');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when verifyAccessToken throws (invalid/expired token)', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.verifyAccessToken.mockImplementation(() => {
      throw new UnauthorizedException('Invalid token');
    });
    const ctx = createMockContext('Bearer bad-token');

    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('checks IS_PUBLIC_KEY metadata via reflector', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.verifyAccessToken.mockReturnValue({ sub: '1', email: 'x@y.com' });
    const ctx = createMockContext('Bearer tok');

    guard.canActivate(ctx);

    expect(reflector.getAllAndOverride).toHaveBeenCalledOnce();
    expect(reflector.getAllAndOverride.mock.calls[0][0]).toBe(IS_PUBLIC_KEY);
    expect(reflector.getAllAndOverride.mock.calls[0][1]).toHaveLength(2);
  });
});
