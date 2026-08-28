import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PackageCategoriesService } from './package-categories.service';
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

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
  findAll(@Query() query: PaginationDto) {
    return this.packageCategoriesService.findAll(query);
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