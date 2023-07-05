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
  LocationSerializer,
  LocationsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateLocationDto,
  FilterDto,
  OneFilterDto,
  UpdateLocationDto,
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
import { LocationsProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => LocationSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class LocationsResolver {
  constructor(private readonly provider: LocationsProvider) {}

  @Query(() => TotalSerializer)
  @SetScope(Scope.ReadGeneralLocations)
  @SetPolicy(Action.Read, Resource.GeneralLocations)
  countLocation(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .count(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Mutation(() => LocationSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @SetPolicy(Action.Create, Resource.GeneralLocations)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createLocation(
    @Meta() meta: Metadata,
    @Args('data') data: CreateLocationDto,
  ): Observable<LocationSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Query(() => LocationsSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadGeneralLocations)
  @SetPolicy(Action.Read, Resource.GeneralLocations)
  findLocations(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<LocationsSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationsSerializer, 'array'));
  }

  @Query(() => LocationSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadGeneralLocations)
  @SetPolicy(Action.Read, Resource.GeneralLocations)
  findLocation(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findById(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Mutation(() => LocationSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @SetPolicy(Action.Delete, Resource.GeneralLocations)
  deleteLocation(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Mutation(() => LocationSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @SetPolicy(Action.Restore, Resource.GeneralLocations)
  restoreLocation(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Mutation(() => LocationSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageGeneralLocations)
  @SetPolicy(Action.Destroy, Resource.GeneralLocations)
  destroyLocation(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Mutation(() => LocationSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @SetPolicy(Action.Update, Resource.GeneralLocations)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateLocation(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateLocationDto,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Mutation(() => TotalSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageGeneralLocations)
  @SetPolicy(Action.Update, Resource.GeneralLocations)
  updateLocations(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateLocationDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
