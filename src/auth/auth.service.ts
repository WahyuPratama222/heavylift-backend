import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. cek email sudah ada atau belum
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 2. hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. simpan ke users dan members dalam 1 transaksi
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

    // 4. generate JWT token
    const token = await this.jwt.signAsync({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return {
      access_token: token,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.member.name,
      },
    };
  }

  async login(dto: LoginDto) {
    // 1. cek email ada atau tidak
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { member: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. cek password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. generate JWT token
    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.member?.name ?? 'Owner',
      },
    };
  }
}
