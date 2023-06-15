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
  GrantSerializer,
  GrantsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateGrantDto,
  FilterDto,
  OneFilterDto,
  UpdateGrantDto,
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
import { GrantsProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => GrantSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class GrantsResolver {
  constructor(private readonly provider: GrantsProvider) {}

  @Query(() => TotalSerializer)
  @SetScope(Scope.ReadAuthGrants)
  @SetPolicy(Action.Read, Resource.AuthGrants)
  countGrant(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .count(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Mutation(() => GrantSerializer)
  @SetScope(Scope.WriteAuthGrants)
  @UseInterceptors(CreateInterceptor)
  @SetPolicy(Action.Create, Resource.AuthGrants)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createGrant(
    @Meta() meta: Metadata,
    @Args('data') data: CreateGrantDto,
  ): Observable<GrantSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(GrantSerializer));
  }

  @Query(() => GrantsSerializer)
  @SetScope(Scope.ReadAuthGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Read, Resource.AuthGrants)
  findGrants(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<GrantsSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(GrantsSerializer, 'array'));
  }

  @Query(() => GrantSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadAuthGrants)
  @SetPolicy(Action.Read, Resource.AuthGrants)
  findGrant(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<GrantSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findById(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(GrantSerializer));
  }

  @Mutation(() => GrantSerializer)
  @SetScope(Scope.WriteAuthGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Delete, Resource.AuthGrants)
  deleteGrant(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<GrantSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(GrantSerializer));
  }

  @Mutation(() => GrantSerializer)
  @SetScope(Scope.WriteAuthGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Restore, Resource.AuthGrants)
  restoreGrant(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<GrantSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(GrantSerializer));
  }

  @Mutation(() => GrantSerializer)
  @SetScope(Scope.ManageAuthGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Destroy, Resource.AuthGrants)
  destroyGrant(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<GrantSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(GrantSerializer));
  }

  @Mutation(() => GrantSerializer)
  @SetScope(Scope.WriteAuthGrants)
  @UseInterceptors(UpdateInterceptor)
  @SetPolicy(Action.Update, Resource.AuthGrants)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateGrant(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateGrantDto,
  ): Observable<GrantSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(GrantSerializer));
  }

  @Mutation(() => TotalSerializer)
  @SetScope(Scope.ManageAuthGrants)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetPolicy(Action.Update, Resource.AuthGrants)
  updateGrants(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateGrantDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
