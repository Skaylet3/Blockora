import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const data: { displayName?: string | null } = {};

    if ('displayName' in dto) {
      data.displayName = dto.displayName ?? null;
    }

    const user = await this.prisma.db.user.update({
      where: { id: userId },
      data,
    });

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
    };
  }
}
