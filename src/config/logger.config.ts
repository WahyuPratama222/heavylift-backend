import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { stdSerializers, LevelWithSilent } from 'pino';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';

interface RequestWithContext extends IncomingMessage {
  user?: { id: string; role: string };
  logContext?: Record<string, unknown>;
}

export function createLoggerConfig(configService: ConfigService): Params {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    pinoHttp: {
      genReqId: (req: IncomingMessage, res: ServerResponse): string => {
        const existing = req.headers['x-request-id'];
        const id = Array.isArray(existing)
          ? existing[0]
          : existing || randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      level:
        configService.get<string>('LOG_LEVEL') ||
        (isProduction ? 'info' : 'debug'),
      autoLogging: true,
      customLogLevel: (
        req: IncomingMessage,
        res: ServerResponse,
      ): LevelWithSilent => {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customProps: (req: RequestWithContext): Record<string, unknown> => {
        const identity =
          req.user?.id && req.user?.role
            ? `${req.user.role}:${req.user.id}`
            : 'anonymous';
        return { identity, ...(req.logContext || {}) };
      },
      serializers: {
        req: (req: IncomingMessage & { id?: string | number }) => ({
          id: req.id,
          method: req.method,
          url: req.url,
        }),
        res: (res: ServerResponse) => ({
          statusCode: res.statusCode,
        }),
        err: stdSerializers.err,
      },
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: { singleLine: false, colorize: true },
          },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-api-key"]',
          'req.body.password',
          'req.body.oldPassword',
          'req.body.confirmPassword',
        ],
        censor: '**REDACTED**',
      },
    },
  };
}
