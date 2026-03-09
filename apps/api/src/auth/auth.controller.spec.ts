import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
};

const mockUsersService = {
  getProfile: vi.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return token pair', async () => {
      const dto = { email: 'a@b.com', password: 'password123', captchaToken: 'test-token' };
      const tokens = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.register.mockResolvedValue(tokens);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });

    it('should propagate ConflictException from authService', async () => {
      const { ConflictException } = await import('@nestjs/common');
      const dto = { email: 'dup@b.com', password: 'password123', captchaToken: 'test-token' };
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should call authService.login and return token pair', async () => {
      const dto = { email: 'a@b.com', password: 'password123', captchaToken: 'test-token' };
      const tokens = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthService.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });

    it('should propagate UnauthorizedException from authService', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      const dto = { email: 'a@b.com', password: 'wrong', captchaToken: 'test-token' };
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return new token pair', async () => {
      const dto = { refreshToken: 'old-rt', captchaToken: 'test-token' };
      const tokens = { accessToken: 'new-at', refreshToken: 'new-rt' };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh(dto);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto);
      expect(result).toEqual(tokens);
    });

    it('should propagate UnauthorizedException for invalid refresh token', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      const dto = { refreshToken: 'expired-rt', captchaToken: 'test-token' };
      mockAuthService.refresh.mockRejectedValue(
        new UnauthorizedException('Unauthorized'),
      );

      await expect(controller.refresh(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const user = { sub: 'user-1', email: 'a@b.com' };

      await controller.logout(user);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1');
    });

    it('should return void (undefined)', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const user = { sub: 'user-1', email: 'a@b.com' };

      const result = await controller.logout(user);

      expect(result).toBeUndefined();
    });
  });

  describe('me', () => {
    it('should delegate to usersService.getProfile and return profile', async () => {
      const profile = { userId: 'user-1', email: 'a@b.com', displayName: null };
      mockUsersService.getProfile.mockResolvedValue(profile);
      const user = { sub: 'user-1', email: 'a@b.com' };

      const result = await controller.me(user);

      expect(mockUsersService.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(profile);
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      mockUsersService.getProfile.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      const user = { sub: 'nonexistent', email: 'a@b.com' };

      await expect(controller.me(user)).rejects.toThrow(NotFoundException);
    });
  });
});
