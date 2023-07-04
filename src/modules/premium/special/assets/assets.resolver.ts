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
  AssetSerializer,
  AssetsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateAssetDto,
  FilterDto,
  OneFilterDto,
  UpdateAssetDto,
} from '@app/common/dto';
import { assignIdToFilterQuery, mapToInstance } from '@app/common/utils';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Resource, Scope, Action } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { GraphqlInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { AssetsProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => AssetSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class AssetsResolver {
  constructor(private readonly provider: AssetsProvider) {}

  @Query(() => TotalSerializer)
  @SetScope(Scope.ReadSpecialAssets)
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  countAsset(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider
      .count(filter, { meta })
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Mutation(() => AssetSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @SetPolicy(Action.Create, Resource.SpecialAssets)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createAsset(
    @Meta() meta: Metadata,
    @Args('data') data: CreateAssetDto,
  ): Observable<AssetSerializer> {
    return this.provider
      .create(data, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Query(() => AssetsSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadSpecialAssets)
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  findAssets(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<AssetsSerializer> {
    return this.provider
      .find(filter, { meta })
      .pipe(mapToInstance(AssetsSerializer, 'array'));
  }

  @Query(() => AssetSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadSpecialAssets)
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  findAsset(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .findOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Mutation(() => AssetSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @SetPolicy(Action.Delete, Resource.SpecialAssets)
  deleteAsset(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .deleteOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Mutation(() => AssetSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @SetPolicy(Action.Restore, Resource.SpecialAssets)
  restoreAsset(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .restoreOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Mutation(() => AssetSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageSpecialAssets)
  @SetPolicy(Action.Destroy, Resource.SpecialAssets)
  destroyAsset(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .destroyOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Mutation(() => AssetSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @SetPolicy(Action.Update, Resource.SpecialAssets)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateAsset(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateAssetDto,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .updateOne(data, filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Mutation(() => TotalSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageSpecialAssets)
  @SetPolicy(Action.Update, Resource.SpecialAssets)
  updateAssets(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateAssetDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider
      .updateBulk(data, filter, { meta })
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
