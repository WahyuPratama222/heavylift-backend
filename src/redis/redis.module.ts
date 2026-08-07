import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis(process.env.REDIS_URL as string);
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}