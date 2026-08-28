import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';
import { handlePrismaError } from '../common/helpers/prisma-error.helper';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/utils/paginate.util';

@Injectable()
export class PackageCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePackageCategoryDto) {
    try {
      return await this.prisma.packageCategory.create({
        data: dto,
      });
    } catch (e) {
      handlePrismaError(e, 'Package category with this name already exists');
    }
  }

  async findAll(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return paginate(
      this.prisma,
      this.prisma.packageCategory,
      { orderBy: { created_at: 'desc' } },
      page,
      limit,
    );
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

    try {
      return await this.prisma.packageCategory.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      handlePrismaError(e, 'Package category with this name already exists');
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    const packageCount = await this.prisma.package.count({
      where: { category_id: id },
    });

    if (packageCount > 0) {
      throw new ConflictException(
        `Cannot delete category that still has ${packageCount} packages`,
      );
    }

    await this.prisma.packageCategory.delete({ where: { id } });
    return { message: 'Package category deleted successfully' };
  }
}
