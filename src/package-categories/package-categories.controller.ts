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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PackageCategoriesService } from './package-categories.service';
import { CreatePackageCategoryDto } from './dto/create-package-category.dto';
import { UpdatePackageCategoryDto } from './dto/update-package-category.dto';
import { Public } from '../common/decorators/public.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';

@ApiTags('Package Categories')
@Controller('package-categories')
export class PackageCategoriesController {
  constructor(
    private readonly packageCategoriesService: PackageCategoriesService,
  ) {}

  @ApiOperation({ summary: 'Create a package category (owner only)' })
  @ApiResponse({ status: 201, description: 'Package category created successfully' })
  @ApiResponse({ status: 409, description: 'Package category with this name already exists' })
  @OwnerEndpoint()
  @Post()
  create(@Body() dto: CreatePackageCategoryDto) {
    return this.packageCategoriesService.create(dto);
  }

  @ApiOperation({ summary: 'List package categories (public)' })
  @ApiResponse({ status: 200, description: 'Paginated list of package categories' })
  @Public()
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.packageCategoriesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single package category by id (public)' })
  @ApiResponse({ status: 200, description: 'Package category details' })
  @ApiResponse({ status: 404, description: 'Package category not found' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packageCategoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a package category (owner only)' })
  @ApiResponse({ status: 200, description: 'Package category updated successfully' })
  @ApiResponse({ status: 404, description: 'Package category not found' })
  @ApiResponse({ status: 409, description: 'Package category with this name already exists' })
  @OwnerEndpoint()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePackageCategoryDto) {
    return this.packageCategoriesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a package category (owner only)' })
  @ApiResponse({ status: 200, description: 'Package category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Package category not found' })
  @ApiResponse({ status: 409, description: 'Category still has packages assigned to it' })
  @OwnerEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packageCategoriesService.remove(id);
  }
}