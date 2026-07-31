import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindAttendancesDto } from './dto/find-attendance.dto';

const attendanceSelect = {
  id: true,
  check_in_at: true,
  check_out_at: true,
  created_at: true,
};

@Injectable()
export class AttendancesService {
  constructor(private prisma: PrismaService) {}

  private async resolveMemberId(userId: string): Promise<string> {
    const member = await this.prisma.member.findUnique({
      where: { user_id: userId },
    });

    if (!member || member.deleted_at) {
      throw new NotFoundException('Member not found');
    }

    return member.id;
  }

  async checkIn(userId: string) {
    const memberId = await this.resolveMemberId(userId);

    const activePackage = await this.prisma.memberPackage.findFirst({
      where: { member_id: memberId, status: 'active' },
    });

    if (!activePackage) {
      throw new ForbiddenException('You need an active package to check in');
    }

    const activeSession = await this.prisma.attendance.findFirst({
      where: { member_id: memberId, check_out_at: null },
    });

    if (activeSession) {
      throw new ConflictException('You already have an active session');
    }

    return this.prisma.attendance.create({
      data: { member_id: memberId },
      select: attendanceSelect,
    });
  }

  async checkOut(userId: string) {
    const memberId = await this.resolveMemberId(userId);

    const activeSession = await this.prisma.attendance.findFirst({
      where: { member_id: memberId, check_out_at: null },
    });

    if (!activeSession) {
      throw new NotFoundException('No active session found');
    }

    return this.prisma.attendance.update({
      where: { id: activeSession.id },
      data: { check_out_at: new Date() },
      select: attendanceSelect,
    });
  }

  async getStatus(userId: string) {
    const memberId = await this.resolveMemberId(userId);

    return this.prisma.attendance.findFirst({
      where: { member_id: memberId, check_out_at: null },
      select: attendanceSelect,
    });
  }

  async findMyHistory(userId: string) {
    const memberId = await this.resolveMemberId(userId);

    return this.prisma.attendance.findMany({
      where: { member_id: memberId },
      orderBy: { check_in_at: 'desc' },
      select: attendanceSelect,
    });
  }

  async findAll(query: FindAttendancesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      ...(query.member_id && { member_id: query.member_id }),
      ...(query.date_from || query.date_to
        ? {
            check_in_at: {
              ...(query.date_from && { gte: new Date(query.date_from) }),
              ...(query.date_to && { lte: new Date(query.date_to) }),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        orderBy: { check_in_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          ...attendanceSelect,
          member: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

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
}