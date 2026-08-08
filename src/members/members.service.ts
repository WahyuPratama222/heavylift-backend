import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { Prisma, Gender } from '@prisma/client';

// reusable select untuk profile member
const memberProfileSelect = {
  id: true,
  name: true,
  phone: true,
  photo_url: true,
  date_of_birth: true,
  gender: true,
  address: true,
  created_at: true,
  updated_at: true,
  user: {
    select: {
      email: true,
      role: true,
    },
  },
};

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
      select: {
        ...memberProfileSelect,
        deleted_at: true,
      },
    });

    if (!member || member.deleted_at) {
      throw new NotFoundException('Member not found');
    }

    const { deleted_at, ...result } = member;
    return result;
  }

  async updateProfile(userId: string, dto: UpdateMemberDto) {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });

    if (!member || member.deleted_at) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.update({
      where: { id: member.id },
      data: {
        ...dto,
        date_of_birth: dto.date_of_birth
          ? new Date(dto.date_of_birth)
          : undefined,
      },
      select: memberProfileSelect,
    });
  }

  async updatePhoto(userId: string, dto: UpdatePhotoDto) {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });

    if (!member || member.deleted_at) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.update({
      where: { id: member.id },
      data: { photo_url: dto.photo_url },
      select: memberProfileSelect,
    });
  }

  async findAll(search?: string, status?: string, gender?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {
      deleted_at: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (status === 'active') {
      where.member_packages = { some: { status: 'active' } };
    } else if (status === 'pending_payment') {
      where.member_packages = { some: { status: 'pending_payment' } };
    } else if (status === 'expired') {
      where.member_packages = { every: { status: 'expired' }, some: {} };
    } else if (status === 'no_package') {
      where.member_packages = { none: {} };
    }

    if (gender) {
      where.gender = gender as Gender;
    }

    const [members, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          photo_url: true,
          gender: true,
          created_at: true,
          updated_at: true,
          member_packages: {
            select: { status: true },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    const data = members.map((member) => {
      const { member_packages, ...rest } = member;

      let derivedStatus: string;
      if (member_packages.length === 0) {
        derivedStatus = 'no_package'; // belum pernah beli paket
      } else {
        const latestStatus = member_packages[0].status; // paket terbaru
        if (latestStatus === 'active') {
          derivedStatus = 'active';
        } else if (latestStatus === 'pending_payment') {
          derivedStatus = 'pending_payment';
        } else {
          derivedStatus = 'expired'; // expired atau cancelled dianggap sama
        }
      }

      return { ...rest, status: derivedStatus };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        name: true,
        phone: true,
        photo_url: true,
        date_of_birth: true,
        gender: true,
        address: true,
        created_at: true,
        updated_at: true,
        user: {
          select: { email: true },
        },
        member_packages: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true,
            package: {
              select: { name: true, price: true },
            },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                paid_at: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return {
      ...member,
      member_packages: member.member_packages.map((mp) => ({
        ...mp,
        package: {
          ...mp.package,
          price: Number(mp.package.price),
        },
        payments: mp.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      })),
    };
  }

  async remove(id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, deleted_at: null },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.member.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Member deleted successfully' };
  }
}