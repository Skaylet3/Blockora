import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { APP_CONFIG } from '../config/config.module';
import type { AppConfig } from '../config/env';
import { JwtPayload } from './types/jwt-payload.type';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.prisma.db.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.db.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.db.user.findFirst({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email);
  }

  async refresh(dto: RefreshDto): Promise<TokenPair> {
    // Find all active (non-revoked, non-expired) refresh tokens and verify
    const activeTokens = await this.prisma.db.refreshToken.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedToken: (typeof activeTokens)[0] | null = null;
    for (const rt of activeTokens) {
      const matches = await argon2.verify(rt.tokenHash, dto.refreshToken);
      if (matches) {
        matchedToken = rt;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Revoke the used token (rotation)
    await this.prisma.db.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });

    // Look up user to get current email
    const user = await this.prisma.db.user.findFirst({
      where: { id: matchedToken.userId },
    });
    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private async issueTokens(userId: string, email: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload as any, {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_ACCESS_EXPIRES_IN as any,
    });

    const rawRefreshToken = crypto.randomUUID();
    const tokenHash = await argon2.hash(rawRefreshToken);

    const expiresAt = new Date();
    // Parse the refresh expires-in duration to compute expiry date
    expiresAt.setTime(
      expiresAt.getTime() + parseDurationMs(this.config.JWT_REFRESH_EXPIRES_IN),
    );

    await this.prisma.db.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}

/** Convert simple duration strings like '7d', '15m', '1h' to milliseconds. */
function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? multipliers['d']);
}
