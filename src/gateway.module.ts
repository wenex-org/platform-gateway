import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { REDIS_OPTIONS } from '@app/common/configs';
import { HealthModule } from '@app/health';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';

import * as modules from './modules';

@Module({
  imports: [
    ...Object.values(modules),

    PrometheusModule.register(),
    RedisModule.register(REDIS_OPTIONS()),
    HealthModule.register(['disk', 'memory']),
  ],
})
export class GatewayModule {}
