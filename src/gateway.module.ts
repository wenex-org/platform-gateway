import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ComplexityPlugin, DateScalar } from './common';
import { JWT_SECRET } from '@app/common/configs';
import { GraphQLModule } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { HealthModule } from '@app/health';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { join } from 'path';

import * as modules from './modules';

@Module({
  imports: [
    ...Object.values(modules),

    PrometheusModule.register(),
    HealthModule.register(['disk', 'memory']),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      playground: false,
      driver: ApolloDriver,
      resolvers: { JSON: GraphQLJSON },
      subscriptions: { 'graphql-ws': true },
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    JwtModule.register({ secret: JWT_SECRET(), global: true }),
  ],
  providers: [DateScalar, ComplexityPlugin],
})
export class GatewayModule {}
