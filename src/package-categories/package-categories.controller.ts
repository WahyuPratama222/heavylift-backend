import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PackageCategoriesService } from './package-categories.service';
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('package-categories')
export class PackageCategoriesController {
  constructor(
    private readonly packageCategoriesService: PackageCategoriesService,
  ) {}

  @Roles('owner')
  @Post()
  create(@Body() dto: CreatePackageCategoryDto) {
    return this.packageCategoriesService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.packageCategoriesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageCategoriesService.findOne(id);
  }

  @Roles('owner')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePackageCategoryDto) {
    return this.packageCategoriesService.update(id, dto);
  }

  @Roles('owner')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packageCategoriesService.remove(id);
  }
}
