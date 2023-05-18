import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DirectiveLocation, GraphQLDirective } from 'graphql';
import { upperDirectiveTransformer } from './common';
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
      playground: false,
      driver: ApolloDriver,
      installSubscriptionHandlers: true,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      transformSchema: (schema) => upperDirectiveTransformer(schema, 'upper'),
      buildSchemaOptions: {
        directives: [
          new GraphQLDirective({
            name: 'upper',
            locations: [DirectiveLocation.FIELD_DEFINITION],
          }),
        ],
      },
    }),
  ],
})
export class GatewayModule {}
