import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { stdSerializers } from 'pino';

export function createLoggerConfig(configService: ConfigService): Params {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    pinoHttp: {
      level: configService.get<string>('LOG_LEVEL') || (isProduction ? 'info' : 'debug'),
      autoLogging: false,
      serializers: {
        req: (req) => ({ id: req.id }),
        res: (res) => ({ statusCode: res.statusCode }),
        err: stdSerializers.err
      },
      transport: isProduction
        ? undefined
        : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
      redact: {
        paths: ['req.headers.authorization', 'req.body.password'],
        censor: '**REDACTED**',
      },
    },
  };
}