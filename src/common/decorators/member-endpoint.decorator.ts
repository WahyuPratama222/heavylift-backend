import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Roles } from './roles.decorator';

export function MemberEndpoint() {
  return applyDecorators(
    Roles('member'),
    ApiBearerAuth(),
    ApiResponse({ status: 403, description: 'Forbidden — requires member role' }),
  );
}