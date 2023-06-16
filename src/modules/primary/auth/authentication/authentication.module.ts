import { NODE_ENV, REDIS_CONFIG, SENTRY_DSN } from '@app/common/configs';
import { AuthenticationProvider } from '@app/common/providers';
import { ClientsModule } from '@nestjs/microservices';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@app/redis';

import { AuthenticationController } from './authentication.controller';
import { AuthenticationResolver } from './authentication.resolver';
import { clientsModuleOptions } from './authentication.const';

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
  controllers: [AuthenticationController],
  providers: [AuthenticationProvider, AuthenticationResolver],
  exports: [AuthenticationProvider],
})
export class AuthenticationModule {}
