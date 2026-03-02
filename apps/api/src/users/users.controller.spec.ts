import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUsersService = {
  updateProfile: vi.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    vi.clearAllMocks();
  });

  describe('updateMe', () => {
    it('calls usersService.updateProfile with user.sub and dto, returns result', async () => {
      const profile = { userId: 'u1', email: 'a@b.com', displayName: 'Alice' };
      mockUsersService.updateProfile.mockResolvedValue(profile);
      const user = { sub: 'u1', email: 'a@b.com' };
      const dto = { displayName: 'Alice' };

      const result = await controller.updateMe(user, dto);

      expect(mockUsersService.updateProfile).toHaveBeenCalledWith('u1', dto);
      expect(result).toEqual(profile);
    });
  });
});
