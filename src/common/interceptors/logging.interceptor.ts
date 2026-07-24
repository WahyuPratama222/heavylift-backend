import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const start = Date.now();

    this.logger.log(`→ ${method} ${originalUrl}`);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        this.logger.log(`← ${method} ${originalUrl} ${res.statusCode} ${duration}ms`);
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        const status = err.status || 500;
        this.logger.error(`← ${method} ${originalUrl} ${status} ${duration}ms - ${err.message}`);
        throw err;
      }),
    );
  }
}