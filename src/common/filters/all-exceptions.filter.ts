import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@InjectPinoLogger('HTTP') private readonly logger: PinoLogger) {}

    catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const status =
        exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Ambil response asli dari HttpException (biar 'error' & 'message' bawaan Nest tetap sama persis)
    const exceptionResponse =
        exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error', error: 'Internal Server Error' };

    const message =
        typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message;

    const { method, originalUrl, user } = req;
    const identity = user ? `${user.role}:${user.id}` : 'anonymous';
    const logData = { method, url: originalUrl, identity, statusCode: status };

    if (status >= 500) {
        this.logger.error({ ...logData, err: exception }, message);
    } else {
        this.logger.warn(logData, message);
    }

    res.status(status).json({
        ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
        path: originalUrl,
        timestamp: new Date().toISOString(),
    });
  }
}