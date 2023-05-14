import { NODE_ENV, SENTRY_DSN } from '@app/common/configs';
import { ClientsModule } from '@nestjs/microservices';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { Module } from '@nestjs/common';

import { AuthorizationController } from './authorization.controller';
import { AuthorizationProvider } from './authorization.provider';
import { clientsModuleOptions } from './authorization.const';

@Module({
  imports: [
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
  providers: [AuthorizationProvider],
})
export class AuthorizationModule {}
