import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { Prisma, Gender } from '@prisma/client';
import { paginate } from '../common/utils/paginate.util';
import { FindMembersDto } from './dto/find-member.dto';
import { mapMemberStatus } from './members.mapper';
import { resolveMemberId } from '../common/helpers/resolve-member.helper';
import { toNumber } from '../common/utils/decimal.util';
import { deletedResponse } from '../common/utils/deleted-response.util';

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

type MemberListItem = Prisma.MemberGetPayload<{
  select: {
    id: true;
    name: true;
    phone: true;
    photo_url: true;
    gender: true;
    created_at: true;
    updated_at: true;
    member_packages: { select: { status: true } };
  };
}>;

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
    const memberId = await resolveMemberId(this.prisma, userId);

    return this.prisma.member.update({
      where: { id: memberId },
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
    const memberId = await resolveMemberId(this.prisma, userId);

    return this.prisma.member.update({
      where: { id: memberId },
      data: { photo_url: dto.photo_url },
      select: memberProfileSelect,
    });
  }

  async findAll(query: FindMembersDto) {
    const { search, status, gender } = query;

    const where: Prisma.MemberWhereInput = { deleted_at: null };

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

    const result = await paginate<MemberListItem>(
      this.prisma,
      this.prisma.member,
      {
        where,
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
      },
      query,
    );

    return { ...result, data: result.data.map(mapMemberStatus) };
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
          price: toNumber(mp.package.price),
        },
        payments: mp.payments.map((p) => ({
          ...p,
          amount: toNumber(p.amount),
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

    return deletedResponse('Member');
  }
}