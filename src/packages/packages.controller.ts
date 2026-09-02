import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { FindPackagesDto } from './dto/find-package.dto';
import { Public } from '../common/decorators/public.decorator';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';

@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @ApiOperation({ summary: 'Create a package (owner only)' })
  @ApiResponse({ status: 201, description: 'Package created successfully' })
  @ApiResponse({ status: 404, description: 'Package category not found' })
  @ApiResponse({ status: 409, description: 'Package with this name already exists' })
  @OwnerEndpoint()
  @Post()
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }

  @ApiOperation({
    summary: 'List active packages (public)',
    description: 'Supports filtering by category_id.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of packages' })
  @Public()
  @Get()
  findAll(@Query() query: FindPackagesDto) {
    return this.packagesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get a single package by id (public)' })
  @ApiResponse({ status: 200, description: 'Package details' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a package (owner only)' })
  @ApiResponse({ status: 200, description: 'Package updated successfully' })
  @ApiResponse({ status: 404, description: 'Package or package category not found' })
  @ApiResponse({ status: 409, description: 'Package with this name already exists' })
  @OwnerEndpoint()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete a package (owner only)' })
  @ApiResponse({ status: 200, description: 'Package deleted successfully' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiResponse({ status: 409, description: 'Package still has members using it' })
  @OwnerEndpoint()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}