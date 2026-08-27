import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

// Only randomUUID is mocked so jti is deterministic in tests; createHash stays real
// so hash assertions below can be computed the same way the service computes them.
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(),
}));

import { randomUUID } from 'crypto';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

describe('AuthService', () => {
  let service: AuthService;

  const mockTx = {
    user: { create: jest.fn() },
    member: { create: jest.fn() },
  };

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockJwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    pipelineDel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation((callback) => callback(mockTx));
    mockJwt.signAsync.mockResolvedValue('dummy-token');
    (randomUUID as jest.Mock).mockReturnValue('jti-1234');
  });

  // ============ REGISTER ============
  describe('register', () => {
    const registerDto = {
      email: 'wahyu@gmail.com',
      password: 'password123',
      name: 'Wahyu Pratama',
    };

    it('should register successfully and store hashed refresh token under a per-device key', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockTx.user.create.mockResolvedValue({ id: 'user-1', email: registerDto.email, role: 'member' });
      mockTx.member.create.mockResolvedValue({ id: 'member-1', name: registerDto.name });

      const result = await service.register(registerDto as any);

      expect(result.access_token).toBe('dummy-token');
      expect(result.refresh_token).toBe('dummy-token');

      // Key includes user_id + jti; value is the token's hash, never the raw token
      expect(mockRedis.set).toHaveBeenCalledWith(
        'refresh_token:user-1:jti-1234',
        hashToken('dummy-token'),
        expect.any(Number),
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('refresh_sessions:user-1', 'jti-1234');
    });

    it('should throw ConflictException if email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });
      await expect(service.register(registerDto as any)).rejects.toThrow(ConflictException);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ============ LOGIN ============
  describe('login', () => {
    const loginDto = { email: 'wahyu@gmail.com', password: 'password123' };

    it('should login successfully and register a new session', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: hashedPassword,
        role: 'member',
        member: { name: 'Wahyu Pratama', deleted_at: null },
      });

      const result = await service.login(loginDto);

      expect(result.access_token).toBe('dummy-token');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'refresh_token:user-1:jti-1234',
        hashToken('dummy-token'),
        expect.any(Number),
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('refresh_sessions:user-1', 'jti-1234');
    });

    it('should default name to "Owner" if user has no member', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        email: loginDto.email,
        password: hashedPassword,
        role: 'owner',
        member: null,
      });

      const result = await service.login(loginDto);
      expect(result.user.name).toBe('Owner');
    });

    it('should throw UnauthorizedException if email not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============ REFRESH TOKENS ============
  describe('refreshTokens', () => {
    const dto = { refresh_token: 'valid-refresh-token' };
    const payload = {
      sub: 'user-1',
      email: 'wahyu@gmail.com',
      role: 'member',
      jti: 'jti-old',
    };

    it('should rotate the session if the hash matches what is stored in redis', async () => {
      mockJwt.verifyAsync.mockResolvedValue(payload);
      mockRedis.get.mockResolvedValue(hashToken('valid-refresh-token'));

      const result = await service.refreshTokens(dto);

      expect(result.access_token).toBe('dummy-token');
      expect(mockRedis.get).toHaveBeenCalledWith('refresh_token:user-1:jti-old');
      expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:user-1:jti-old');
      expect(mockRedis.srem).toHaveBeenCalledWith('refresh_sessions:user-1', 'jti-old');
    });

    it('should revoke every session for that user upon token reuse detection', async () => {
      mockJwt.verifyAsync.mockResolvedValue(payload);
      mockRedis.get.mockResolvedValue(null); // stored hash missing — already rotated/used
      mockRedis.smembers.mockResolvedValue(['jti-old', 'jti-other-device']);

      await expect(service.refreshTokens(dto)).rejects.toThrow(UnauthorizedException);

      expect(mockRedis.smembers).toHaveBeenCalledWith('refresh_sessions:user-1');
      expect(mockRedis.pipelineDel).toHaveBeenCalledWith([
        'refresh_token:user-1:jti-old',
        'refresh_token:user-1:jti-other-device',
      ]);
      expect(mockRedis.del).toHaveBeenCalledWith('refresh_sessions:user-1');
    });

    it('should throw UnauthorizedException if jwt verification fails', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      await expect(service.refreshTokens(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============ LOGOUT ============
  describe('logout', () => {
    it('should delete the specific device session from redis', async () => {
      const logoutDto = { refresh_token: 'valid-refresh-token' };
      mockJwt.verifyAsync.mockResolvedValue({ sub: 'user-1', jti: 'jti-old' });

      const result = await service.logout(logoutDto);

      expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:user-1:jti-old');
      expect(mockRedis.srem).toHaveBeenCalledWith('refresh_sessions:user-1', 'jti-old');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should still respond successfully if the token is already invalid or expired', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      const result = await service.logout({ refresh_token: 'garbage-token' });

      expect(mockRedis.del).not.toHaveBeenCalled();
      expect(mockRedis.srem).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});