import {
  GraphQLFilterQuery,
  GraphQLFilterProjection,
  GraphQLFilterPagination,
  GraphQLMAP,
} from '@app/common/consts';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { GraphQLModule } from '@nestjs/graphql';
import { HealthModule } from '@app/health';
import { Module } from '@nestjs/common';
import * as modules from './modules';
import { join } from 'path';

@Module({
  imports: [
    ...Object.values(modules),

    PrometheusModule.register(),
    HealthModule.register(['disk', 'memory']),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      resolvers: {
        Map: GraphQLMAP,
        FilterQuery: GraphQLFilterQuery,
        // FilterProjection: GraphQLFilterProjection,
        // FilterPagination: GraphQLFilterPagination,
      },
      context: ({ req }) => ({ req }),
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
  ],
})
export class GatewayModule {}
