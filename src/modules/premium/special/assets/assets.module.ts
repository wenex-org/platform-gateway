import { NODE_ENV, REDIS_CONFIG, SENTRY_DSN } from '@app/common/configs';
import { AssetsProvider } from '@app/common/providers';
import { ClientsModule } from '@nestjs/microservices';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';

import { PrivateModule, PublicModule } from './modules';
import { AssetsController } from './assets.controller';
import { clientsModuleOptions } from './assets.const';
import { AssetsResolver } from './assets.resolver';

@Module({
  imports: [
    PublicModule,
    PrivateModule,

    RedisModule.register(REDIS_CONFIG()),
    ClientsModule.register(clientsModuleOptions),
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
  controllers: [AssetsController],
  providers: [AssetsProvider, AssetsResolver],
})
export class AssetsModule {}
