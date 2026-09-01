import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { FindAnnouncementsDto } from './dto/find-announcement.dto';
import { paginate } from '../common/utils/paginate.util';
import { resolveMemberId } from '../common/helpers/resolve-member.helper';
import { deletedResponse } from '../common/utils/deleted-response.util';

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

  private async resolveTargetConditions(
    memberId: string,
  ): Promise<Prisma.AnnouncementWhereInput[]> {
    const latestPackage = await this.prisma.memberPackage.findFirst({
      where: { member_id: memberId },
      orderBy: { created_at: 'desc' },
      select: { status: true, package_id: true },
    });

    const hasActivePackage = latestPackage?.status === 'active';

    const targetConditions: Prisma.AnnouncementWhereInput[] = [{ target: 'all' }];
    if (hasActivePackage) {
      targetConditions.push({ target: 'specific_package', package_id: latestPackage.package_id });
    } else {
      targetConditions.push({ target: 'no_package' });
    }

    return targetConditions;
  }

  async findAll(userId: string, query: FindAnnouncementsDto) {
    const memberId = await resolveMemberId(this.prisma, userId);
    const targetConditions = await this.resolveTargetConditions(memberId);
    const now = new Date();

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
      query,
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

    return deletedResponse('Announcement');
  }
}