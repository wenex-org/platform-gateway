import { NODE_ENV, REDIS_CONFIG, SENTRY_DSN } from '@app/common/configs';
import { ClientsModule as ClientModule } from '@nestjs/microservices';
import { ClientsProvider } from '@app/common/providers';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';

import { ClientsController } from './clients.controller';
import { clientsModuleOptions } from './clients.const';
import { ClientsResolver } from './clients.resolver';

@Module({
  imports: [
    RedisModule.register(REDIS_CONFIG()),
    ClientModule.register(clientsModuleOptions),
    SentryModule.forRoot({
      debug: NODE_ENV().IS_DEVELOPMENT,
      dsn: NODE_ENV().IS_DEVELOPMENT ? undefined : SENTRY_DSN(),
      environment: NODE_ENV().IS_DEVELOPMENT ? 'dev' : 'production',
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
      release: process.env.npm_package_version,
      tracesSampleRate: 1.0,
      maxBreadcrumbs: 10,
    }),
  ],
  controllers: [ClientsController],
  providers: [ClientsProvider, ClientsResolver],
})
export class ClientsModule {}
