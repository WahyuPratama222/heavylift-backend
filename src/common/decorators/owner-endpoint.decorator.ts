import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from './roles.decorator';

export function OwnerEndpoint() {
  return applyDecorators(
    Roles('owner'),
    ApiBearerAuth(),
    ApiResponse({ status: 403, description: 'Forbidden — requires owner role' }),
  );
}