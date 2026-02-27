import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register and return token pair', async () => {
      const dto = { email: 'a@b.com', password: 'password123' };
      const tokens = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.register.mockResolvedValue(tokens);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('login', () => {
    it('should call authService.login and return token pair', async () => {
      const dto = { email: 'a@b.com', password: 'password123' };
      const tokens = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return new token pair', async () => {
      const dto = { refreshToken: 'old-rt' };
      const tokens = { accessToken: 'new-at', refreshToken: 'new-rt' };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh(dto);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const user = { sub: 'user-1', email: 'a@b.com' };

      await controller.logout(user);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
    });
  });

  describe('me', () => {
    it('should return userId and email from the JWT payload', () => {
      const user = { sub: 'user-1', email: 'a@b.com' };

      const result = controller.me(user);

      expect(result).toEqual({ userId: 'user-1', email: 'a@b.com' });
    });
  });
});
