import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

const packageSelect = {
  id: true,
  category_id: true,
  name: true,
  description: true,
  price: true,
  duration_days: true,
  include_trainer: true,
  benefits: true,
  is_active: true,
  created_at: true,
  category: {
    select: { id: true, name: true },
  },
};

function formatPackage(pkg: any) {
  return {
    ...pkg,
    price: Number(pkg.price),
  };
}

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePackageDto) {
    return this.prisma.package.create({
      data: dto,
      include: { category: true },
    });
  }

  async findAll(categoryId?: string) {
    const packages = await this.prisma.package.findMany({
      where: {
        is_active: true,
        ...(categoryId && { category_id: categoryId }),
      },
      select: packageSelect,
      orderBy: { created_at: 'desc' },
    });

    return packages.map(formatPackage);
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