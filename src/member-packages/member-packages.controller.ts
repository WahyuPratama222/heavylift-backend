import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MemberPackagesService } from './member-packages.service';
import { CreateMemberPackageDto } from './dto/create-member-package.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IUser } from '../common/interfaces/user.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OwnerEndpoint } from '../common/decorators/owner-endpoint.decorator';
import { MemberEndpoint } from '../common/decorators/member-endpoint.decorator';

@ApiTags('Member Packages')
@Controller('member-packages')
export class MemberPackagesController {
  constructor(private readonly memberPackagesService: MemberPackagesService) {}

  @ApiOperation({
    summary: 'Purchase a package and generate a payment invoice (member only)',
    description:
      'Creates a pending_payment member package and a Xendit invoice in a single transaction. Rolls back automatically if invoice creation fails.',
  })
  @ApiResponse({ status: 201, description: 'Member package created with a pending payment invoice' })
  @ApiResponse({ status: 404, description: 'Package not found' })
  @ApiResponse({ status: 409, description: 'Member already has an active or pending package' })
  @ApiResponse({ status: 503, description: 'Payment service is currently unavailable' })
  @MemberEndpoint()
  @Post()
  create(@CurrentUser() user: IUser, @Body() dto: CreateMemberPackageDto) {
    return this.memberPackagesService.create(user.id, user.email, dto);
  }

  @ApiOperation({ summary: "Get the current member's package history" })
  @ApiResponse({ status: 200, description: 'Paginated member package history' })
  @MemberEndpoint()
  @Get('my')
  findMy(@CurrentUser() user: IUser, @Query() query: PaginationDto) {
    return this.memberPackagesService.findMy(user.id, query);
  }

  @ApiOperation({ summary: 'List all member packages across all members (owner only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of all member packages' })
  @OwnerEndpoint()
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.memberPackagesService.findAll(query);
  }
}