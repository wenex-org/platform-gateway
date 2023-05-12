import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BlacklistedModule } from '@app/blacklisted';
import { JWT_SECRET } from '@app/common/configs';
import { HealthModule } from '@app/health';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

import * as modules from './modules';

@Module({
  imports: [
    ...Object.values(modules),

    BlacklistedModule,
    PrometheusModule.register(),
    HealthModule.register(['disk', 'memory']),
    JwtModule.register({ secret: JWT_SECRET() }),
  ],
})
export class GatewayModule {}
