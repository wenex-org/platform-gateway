import { NODE_ENV, REDIS_CONFIG, SENTRY_DSN } from '@app/common/configs';
import { AuthorizationProvider } from '@app/common/providers';
import { ClientsModule } from '@nestjs/microservices';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';

import { AuthorizationController } from './authorization.controller';
import { AuthorizationResolver } from './authorization.resolver';
import { clientsModuleOptions } from './authorization.const';

@Global()
@Module({
  imports: [
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
  controllers: [AuthorizationController],
  providers: [AuthorizationProvider, AuthorizationResolver],
})
export class AuthorizationModule {}
