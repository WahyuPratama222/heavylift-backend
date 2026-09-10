// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { resolveExceptionStatus } from '../helpers/log-context.helper';

interface RequestWithLogContext extends Request {
  user?: { id: string; role: string };
  logContext?: Record<string, unknown>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // Gak perlu inject PinoLogger di sini — filter ini gak nge-log manual apapun.
  // pino-http (autoLogging) yang nyatet log-nya, filter cuma nitip data lewat req.

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestWithLogContext>();
    const res = ctx.getResponse<Response>();

    const status = resolveExceptionStatus(exception);

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error', error: 'Internal Server Error' };

    const rawMessage: unknown =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).message
          : undefined;

    const isMultipleErrors = Array.isArray(rawMessage);

    const logMessage =
      status >= HttpStatus.INTERNAL_SERVER_ERROR && exception instanceof Error
        ? exception.message
        : isMultipleErrors
          ? 'Validation failed'
          : typeof rawMessage === 'string'
            ? rawMessage
            : undefined;

    req.logContext = {
      ...(logMessage ? { message: logMessage } : {}),
      ...(isMultipleErrors ? { errors: rawMessage } : {}),
    };

    res.status(status).json({
      ...(typeof exceptionResponse === 'object'
        ? exceptionResponse
        : { message: exceptionResponse }),
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
