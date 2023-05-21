import { NODE_ENV, REDIS_OPTIONS, SENTRY_DSN } from '@app/common/configs';
import { ClientsModule } from '@nestjs/microservices';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';

import { clientsModuleOptions } from './sessions.const';
import { SessionsController } from './sessions.controller';
import { SessionsProvider } from './sessions.provider';
import { SessionsResolver } from './sessions.resolver';
import { UsersFieldResolver } from './resolvers';
import { UsersModule } from '../users';

@Module({
  imports: [
    UsersModule,
    RedisModule.register(REDIS_OPTIONS()),
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
  controllers: [SessionsController],
  providers: [SessionsProvider, SessionsResolver, UsersFieldResolver],
  exports: [SessionsProvider],
})
export class SessionsModule {}
