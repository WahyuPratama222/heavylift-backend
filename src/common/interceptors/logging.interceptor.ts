import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@InjectPinoLogger('HTTP') private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, user } = req;
    const start = Date.now();
    const identity = user ? `${user.role}:${user.id}` : 'anonymous';

    this.logger.info({ method, url: originalUrl, identity }, 'request_start');

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        this.logger.info(
          { method, url: originalUrl, identity, statusCode: res.statusCode, durationMs: duration },
          'request_end',
        );
      }),
    );
  }
}