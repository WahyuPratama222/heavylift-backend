import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import ms, { StringValue } from 'ms';
import { handlePrismaError } from '../common/helpers/prisma-error.helper';
import { getRefreshTokenKey, getSessionsKey } from '../common/helpers/redis-key.helper';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // 1. BUAT HELPER REDIS YANG AMAN: Menghemat try-catch berulang di bawah
  private async safeRedisCall<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (error) {
      throw new ServiceUnavailableException(
        'Session service is currently unavailable, please try again',
      );
    }
  }

  private async generateTokens(payload: { sub: string; email: string; role: string }) {
    const jti = randomUUID();
    const refreshExpiresIn = (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as StringValue;

    const access_token = await this.jwt.signAsync(payload);
    const refresh_token = await this.jwt.signAsync(
      { ...payload, jti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    const ttlSeconds = Math.floor(ms(refreshExpiresIn) / 1000);
    const tokenKey = getRefreshTokenKey(payload.sub, jti);

    await this.safeRedisCall(async () => {
      await this.redis.set(tokenKey, this.hashToken(refresh_token), ttlSeconds);
      await this.redis.sadd(getSessionsKey(payload.sub), jti);
    });

    return { access_token, refresh_token };
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user
        .create({
          data: {
            email: dto.email,
            password: hashedPassword,
            role: 'member',
          },
        })
        .catch((err) => handlePrismaError(err, 'Email already registered'));

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

    // Di luar transaction — kalau Redis gagal di sini, user & member yang
    // baru dibuat TETAP tersimpan (bukan half-broken; mereka bisa langsung
    // login manual lewat POST /auth/login yang gak bergantung ke sini).
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

    if (!user || user.member?.deleted_at) {
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
    let payload: JwtPayload & { jti: string };

    try {
      payload = await this.jwt.verifyAsync<JwtPayload & { jti: string }>(
        dto.refresh_token,
        { secret: this.config.get<string>('JWT_REFRESH_SECRET') },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenKey = getRefreshTokenKey(payload.sub, payload.jti);
    
    // Gunakan helper terpusat agar kode terlihat searah dan tegak lurus (Clean)
    const storedHash = await this.safeRedisCall(() => this.redis.get(tokenKey));
    const incomingHash = this.hashToken(dto.refresh_token);

    if (!storedHash || storedHash !== incomingHash) {
      await this.safeRedisCall(async () => {
        const sessionsKey = getSessionsKey(payload.sub);
        const allJtis = await this.redis.smembers(sessionsKey);

        if (allJtis.length > 0) {
          const keysToDelete = allJtis.map((jti) => getRefreshTokenKey(payload.sub, jti));
          await this.redis.pipelineDel(keysToDelete);
        }
        await this.redis.del(sessionsKey);
      });

      throw new UnauthorizedException(
        'Security Breach: Token reuse detected. All sessions revoked.',
      );
    }

    await this.safeRedisCall(async () => {
      await this.redis.del(tokenKey);
      await this.redis.srem(getSessionsKey(payload.sub), payload.jti);
    });

    return this.generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  async logout(dto: RefreshTokenDto) {
    let payload: (JwtPayload & { jti: string }) | undefined;

    try {
      payload = await this.jwt.verifyAsync<JwtPayload & { jti: string }>(
        dto.refresh_token,
        { secret: this.config.get<string>('JWT_REFRESH_SECRET') },
      );
    } catch {
      // Logout aman (idempotent), abaikan jika token palsu/expired
    }

    if (payload) {
      await this.safeRedisCall(async () => {
        await this.redis.del(getRefreshTokenKey(payload!.sub, payload!.jti));
        await this.redis.srem(getSessionsKey(payload!.sub), payload!.jti);
      });
    }

    return { message: 'Logged out successfully' };
  }
}
