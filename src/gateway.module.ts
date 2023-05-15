import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthModule } from '@app/health';
import { Module } from '@nestjs/common';

import * as modules from './modules';

@Module({
  imports: [
    ...Object.values(modules),

    PrometheusModule.register(),
    HealthModule.register(['disk', 'memory']),
  ],
})
export class GatewayModule {}
