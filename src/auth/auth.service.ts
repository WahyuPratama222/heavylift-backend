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
import { createHash, randomUUID } from 'crypto';
import ms, { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Generate a token pair; refresh token gets its own jti (session id) per login
  private async generateTokens(payload: {
    sub: string;
    email: string;
    role: string;
  }) {
    const jti = randomUUID();
    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue;

    const access_token = await this.jwt.signAsync(payload);
    const refresh_token = await this.jwt.signAsync(
      { ...payload, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiresIn,
      },
    );

    const ttlSeconds = Math.floor(ms(refreshExpiresIn) / 1000);
    const tokenKey = `refresh_token:${payload.sub}:${jti}`;

    // Store hash, not the raw token — Redis dump/leak shouldn't hand out usable tokens
    await this.redis.set(tokenKey, this.hashToken(refresh_token), ttlSeconds);
    await this.redis.sadd(`refresh_sessions:${payload.sub}`, jti);

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

  // Rotate valid refresh token, or wipe every session for this user on reuse detection
  async refreshTokens(dto: RefreshTokenDto) {
    let payload: { sub: string; email: string; role: string; jti: string };

    try {
      payload = await this.jwt.verifyAsync(dto.refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenKey = `refresh_token:${payload.sub}:${payload.jti}`;
    const storedHash = await this.redis.get(tokenKey);
    const incomingHash = this.hashToken(dto.refresh_token);

    if (!storedHash || storedHash !== incomingHash) {
      // Token not found (already rotated/used) or mismatched — treat as compromised
      const sessionsKey = `refresh_sessions:${payload.sub}`;
      const allJtis = await this.redis.smembers(sessionsKey);

      if (allJtis.length > 0) {
        const keysToDelete = allJtis.map(
          (jti) => `refresh_token:${payload.sub}:${jti}`,
        );
        await this.redis.pipelineDel(keysToDelete);
      }
      await this.redis.del(sessionsKey);

      throw new UnauthorizedException(
        'Security Breach: Token reuse detected. All sessions revoked.',
      );
    }

    // Valid — rotate: retire this session id, issue a fresh one
    await this.redis.del(tokenKey);
    await this.redis.srem(`refresh_sessions:${payload.sub}`, payload.jti);

    return this.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  // Revoke one specific device session
  async logout(dto: RefreshTokenDto) {
    try {
      const payload: { sub: string; jti: string } = await this.jwt.verifyAsync(
        dto.refresh_token,
        { secret: process.env.JWT_REFRESH_SECRET },
      );
      await this.redis.del(`refresh_token:${payload.sub}:${payload.jti}`);
      await this.redis.srem(`refresh_sessions:${payload.sub}`, payload.jti);
    } catch {
      // Already invalid/expired — logout is idempotent, nothing to clean up
    }
    return { message: 'Logged out successfully' };
  }
}