import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';

@Injectable()
export class PackageCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePackageCategoryDto) {
    return this.prisma.packageCategory.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.packageCategory.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.packageCategory.findUnique({
      where: { id },
    });

    if (!category) throw new NotFoundException('Package category not found');

    return category;
  }

  async update(id: string, dto: UpdatePackageCategoryDto) {
    await this.findOne(id);

    return this.prisma.packageCategory.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const packageCount = await this.prisma.package.count({
      where: { category_id: id },
    });

    if (packageCount > 0) {
      throw new ConflictException(
        'Cannot delete category that still has packages',
      );
    }

    await this.prisma.packageCategory.delete({ where: { id } });
    return { message: 'Package category deleted successfully' };
  }
}
