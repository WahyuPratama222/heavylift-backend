import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePackageDto) {
    return this.prisma.package.create({
      data: dto,
      include: { category: true },
    });
  }

  async findAll() {
    return this.prisma.package.findMany({
      where: { is_active: true },
      include: { category: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!pkg) throw new NotFoundException('Package not found');

    return pkg;
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);

    return this.prisma.package.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const memberPackageCount = await this.prisma.memberPackage.count({
      where: { package_id: id },
    });

    if (memberPackageCount > 0) {
      throw new ConflictException(
        `Cannot delete package that still has ${memberPackageCount} member(s) using it`,
      );
    }

    await this.prisma.package.delete({ where: { id } });

    return { message: 'Package deleted successfully' };
  }
}