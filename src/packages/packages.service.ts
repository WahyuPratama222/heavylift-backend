import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { handlePrismaError } from '../common/helpers/prisma-error.helper';
import { paginate } from '../common/utils/paginate.util';
import { toNumber } from '../common/utils/decimal.util';
import { deletedResponse } from '../common/utils/deleted-response.util';
import { FindPackagesDto } from './dto/find-package.dto';

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
  updated_at: true,
  category: {
    select: { id: true, name: true },
  },
};

function formatPackage(pkg: any) {
  return {
    ...pkg,
    price: toNumber(pkg.price),
  };
}

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.packageCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('Package category not found');
    }
  }

  async create(dto: CreatePackageDto) {
    await this.assertCategoryExists(dto.category_id);

    try {
      const pkg = await this.prisma.package.create({
        data: dto,
        select: packageSelect,
      });
      return formatPackage(pkg);
    } catch (e) {
      handlePrismaError(e, 'Package with this name already exists');
    }
  }

  async findAll(query: FindPackagesDto) {
    const { category_id } = query;

    const result = await paginate(
      this.prisma,
      this.prisma.package,
      {
        where: {
          is_active: true,
          ...(category_id && { category_id }),
        },
        select: packageSelect,
        orderBy: { created_at: 'desc' },
      },
      query,
    );

    return { ...result, data: result.data.map(formatPackage) };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      select: packageSelect,
    });

    if (!pkg) throw new NotFoundException('Package not found');

    return formatPackage(pkg);
  }

  async update(id: string, dto: UpdatePackageDto) {
    await this.findOne(id);

    if (dto.category_id) {
      await this.assertCategoryExists(dto.category_id);
    }

    try {
      const pkg = await this.prisma.package.update({
        where: { id },
        data: dto,
        select: packageSelect,
      });
      return formatPackage(pkg);
    } catch (e) {
      handlePrismaError(e, 'Package with this name already exists');
    }
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

    return deletedResponse('Package');
  }
}