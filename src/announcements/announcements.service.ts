import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { FindAnnouncementsDto } from './dto/find-announcement.dto';
import { paginate } from '../common/utils/paginate.util';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        ...dto,
        type: 'manual',
      },
    });
  }

  async findAll(userId: string, query: FindAnnouncementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const member = await this.prisma.member.findUnique({ where: { user_id: userId } });
    if (!member || member.deleted_at) {
      throw new NotFoundException('Member not found');
    }

    const latestPackage = await this.prisma.memberPackage.findFirst({
      where: { member_id: member.id },
      orderBy: { created_at: 'desc' },
      select: { status: true, package_id: true },
    });

    const hasActivePackage = latestPackage?.status === 'active';
    const now = new Date();

    const targetConditions: Prisma.AnnouncementWhereInput[] = [{ target: 'all' }];
    if (hasActivePackage) {
      targetConditions.push({ target: 'specific_package', package_id: latestPackage.package_id });
    } else {
      targetConditions.push({ target: 'no_package' });
    }

    return paginate(
      this.prisma,
      this.prisma.announcement,
      {
        where: {
          published_at: { lte: now },
          OR: [{ expired_at: { gte: now } }, { expired_at: null }],
          AND: { OR: targetConditions },
        },
        orderBy: { published_at: 'desc' },
      },
      page,
      limit,
    );
}

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.findOne(id);

    return this.prisma.announcement.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.announcement.delete({ where: { id } });

    return { message: 'Announcement deleted successfully' };
  }
}