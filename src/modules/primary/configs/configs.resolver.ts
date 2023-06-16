import {
  ClassSerializerInterceptor,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  AuthorityInterceptor,
  CreateInterceptor,
  FieldInterceptor,
  FilterInterceptor,
  RateLimitInterceptor,
  SetMetadataInterceptor,
  UpdateInterceptor,
} from '@app/common/interceptors';
import {
  TotalSerializer,
  ConfigSerializer,
  ConfigsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateConfigDto,
  FilterDto,
  OneFilterDto,
  UpdateConfigDto,
} from '@app/common/dto';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import {
  assignIdToFilterQuery,
  mapToInstance,
  toGrpcMeta,
  toRaw,
} from '@app/common/utils';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Resource, Scope, Action } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { GraphqlInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ConfigsProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => ConfigSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class ConfigsResolver {
  constructor(private readonly provider: ConfigsProvider) {}

  @SetScope(Scope.ReadConfigs)
  @Query(() => TotalSerializer)
  @SetPolicy(Action.Read, Resource.Configs)
  countConfig(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .count(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @SetScope(Scope.WriteConfigs)
  @Mutation(() => ConfigSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetPolicy(Action.Create, Resource.Configs)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createConfig(
    @Meta() meta: Metadata,
    @Args('data') data: CreateConfigDto,
  ): Observable<ConfigSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @SetScope(Scope.ReadConfigs)
  @Query(() => ConfigsSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Read, Resource.Configs)
  findConfigs(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<ConfigsSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigsSerializer, 'array'));
  }

  @SetScope(Scope.ReadConfigs)
  @Query(() => ConfigSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Read, Resource.Configs)
  findConfig(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findById(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @SetScope(Scope.WriteConfigs)
  @Mutation(() => ConfigSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Delete, Resource.Configs)
  deleteConfig(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @SetScope(Scope.WriteConfigs)
  @Mutation(() => ConfigSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Restore, Resource.Configs)
  restoreConfig(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @SetScope(Scope.ManageConfigs)
  @Mutation(() => ConfigSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Destroy, Resource.Configs)
  destroyConfig(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @SetScope(Scope.WriteConfigs)
  @Mutation(() => ConfigSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetPolicy(Action.Update, Resource.Configs)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateConfig(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateConfigDto,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @SetScope(Scope.ManageConfigs)
  @Mutation(() => TotalSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetPolicy(Action.Update, Resource.Configs)
  updateConfigs(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateConfigDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
