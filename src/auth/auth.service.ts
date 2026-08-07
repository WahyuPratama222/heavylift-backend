import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import ms, { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  private async generateTokens(payload: {
    sub: string;
    email: string;
    role: string;
  }) {
    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ||
      '7d') as StringValue;

    const access_token = await this.jwt.signAsync(payload);

    const refresh_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: refreshExpiresIn,
    });

    const ttlSeconds = Math.floor(ms(refreshExpiresIn) / 1000);

    await this.redis.set(
      `refresh_token:${payload.sub}`,
      refresh_token,
      ttlSeconds,
    );

    return { access_token, refresh_token };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: 'member',
        },
      });

      const member = await tx.member.create({
        data: {
          user_id: user.id,
          name: dto.name,
          phone: dto.phone,
          gender: dto.gender,
          address: dto.address,
        },
      });

      return { user, member };
    });

    const tokens = await this.generateTokens({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return {
      ...tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.member.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { member: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.member?.deleted_at) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.member?.name ?? 'Owner',
      },
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    let payload: { sub: string; email: string; role: string };

    try {
      payload = await this.jwt.verifyAsync(dto.refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.redis.get(`refresh_token:${payload.sub}`);

    if (!stored || stored !== dto.refresh_token) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  async logout(userId: string) {
    await this.redis.del(`refresh_token:${userId}`);
    return { message: 'Logged out successfully' };
  }
}