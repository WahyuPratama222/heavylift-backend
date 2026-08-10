import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockTx = {
    user: { create: jest.fn() },
    member: { create: jest.fn() },
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
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

    // default: $transaction jalanin callback-nya dengan mockTx
    mockPrisma.$transaction.mockImplementation((callback) =>
      callback(mockTx),
    );

    // default: signAsync selalu balikin token dummy
    mockJwt.signAsync.mockResolvedValue('dummy-token');
  });

  // ============ REGISTER ============
  describe('register', () => {
    const registerDto = {
      email: 'wahyu@gmail.com',
      password: 'password123',
      name: 'Wahyu Pratama',
    };

    it('should register successfully and return tokens + user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // email belum terdaftar

      mockTx.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerDto.email,
        role: 'member',
      });
      mockTx.member.create.mockResolvedValue({
        id: 'member-1',
        name: registerDto.name,
      });

      const result = await service.register(registerDto as any);

      expect(result.access_token).toBe('dummy-token');
      expect(result.refresh_token).toBe('dummy-token');
      expect(result.user).toEqual({
        id: 'user-1',
        email: registerDto.email,
        role: 'member',
        name: registerDto.name,
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'refresh_token:user-1',
        'dummy-token',
        expect.any(Number),
      );
    });

    it('should throw ConflictException if email already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto as any)).rejects.toThrow(
        ConflictException,
      );

      // pastikan gak lanjut nyoba bikin user kalau udah ketolak duluan
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ============ LOGIN ============
  describe('login', () => {
    const loginDto = { email: 'wahyu@gmail.com', password: 'password123' };

    it('should login successfully and return tokens + user', async () => {
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
      expect(result.user.name).toBe('Wahyu Pratama');
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

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if member is soft-deleted', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: hashedPassword,
        role: 'member',
        member: { name: 'Wahyu', deleted_at: new Date() },
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: loginDto.email,
        password: hashedPassword,
        role: 'member',
        member: { name: 'Wahyu', deleted_at: null },
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ============ REFRESH TOKENS ============
  describe('refreshTokens', () => {
    const dto = { refresh_token: 'valid-refresh-token' };
    const payload = { sub: 'user-1', email: 'wahyu@gmail.com', role: 'member' };

    it('should refresh successfully if token valid and matches redis', async () => {
      mockJwt.verifyAsync.mockResolvedValue(payload);
      mockRedis.get.mockResolvedValue('valid-refresh-token');

      const result = await service.refreshTokens(dto);

      expect(result.access_token).toBe('dummy-token');
      expect(mockRedis.get).toHaveBeenCalledWith('refresh_token:user-1');
    });

    it('should throw UnauthorizedException if jwt.verifyAsync fails', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if nothing stored in redis', async () => {
      mockJwt.verifyAsync.mockResolvedValue(payload);
      mockRedis.get.mockResolvedValue(null);

      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if stored token does not match', async () => {
      mockJwt.verifyAsync.mockResolvedValue(payload);
      mockRedis.get.mockResolvedValue('a-different-token');

      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ============ LOGOUT ============
  describe('logout', () => {
    it('should delete refresh token from redis and return success message', async () => {
      const result = await service.logout('user-1');

      expect(mockRedis.del).toHaveBeenCalledWith('refresh_token:user-1');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});