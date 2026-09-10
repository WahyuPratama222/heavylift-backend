// src/common/helpers/log-context.helper.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export function resolveExceptionStatus(exception: unknown): HttpStatus {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}
