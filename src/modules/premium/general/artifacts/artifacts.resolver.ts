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
  ArtifactSerializer,
  ArtifactsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateArtifactDto,
  FilterDto,
  OneFilterDto,
  UpdateArtifactDto,
} from '@app/common/dto';
import { assignIdToFilterQuery, mapToInstance } from '@app/common/utils';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Resource, Scope, Action } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { GraphqlInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ArtifactsProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => ArtifactSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class ArtifactsResolver {
  constructor(private readonly provider: ArtifactsProvider) {}

  @Query(() => TotalSerializer)
  @SetScope(Scope.ReadGeneralArtifacts)
  @SetPolicy(Action.Read, Resource.GeneralArtifacts)
  countArtifact(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider
      .count(filter, { meta })
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Mutation(() => ArtifactSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteGeneralArtifacts)
  @SetPolicy(Action.Create, Resource.GeneralArtifacts)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createArtifact(
    @Meta() meta: Metadata,
    @Args('data') data: CreateArtifactDto,
  ): Observable<ArtifactSerializer> {
    return this.provider
      .create(data, { meta })
      .pipe(mapToInstance(ArtifactSerializer));
  }

  @Query(() => ArtifactsSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadGeneralArtifacts)
  @SetPolicy(Action.Read, Resource.GeneralArtifacts)
  findArtifacts(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<ArtifactsSerializer> {
    return this.provider
      .find(filter, { meta })
      .pipe(mapToInstance(ArtifactsSerializer, 'array'));
  }

  @Query(() => ArtifactSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadGeneralArtifacts)
  @SetPolicy(Action.Read, Resource.GeneralArtifacts)
  findArtifact(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ArtifactSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .findOne(filter, { meta })
      .pipe(mapToInstance(ArtifactSerializer));
  }

  @Mutation(() => ArtifactSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteGeneralArtifacts)
  @SetPolicy(Action.Delete, Resource.GeneralArtifacts)
  deleteArtifact(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ArtifactSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .deleteOne(filter, { meta })
      .pipe(mapToInstance(ArtifactSerializer));
  }

  @Mutation(() => ArtifactSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteGeneralArtifacts)
  @SetPolicy(Action.Restore, Resource.GeneralArtifacts)
  restoreArtifact(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ArtifactSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .restoreOne(filter, { meta })
      .pipe(mapToInstance(ArtifactSerializer));
  }

  @Mutation(() => ArtifactSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageGeneralArtifacts)
  @SetPolicy(Action.Destroy, Resource.GeneralArtifacts)
  destroyArtifact(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ArtifactSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .destroyOne(filter, { meta })
      .pipe(mapToInstance(ArtifactSerializer));
  }

  @Mutation(() => ArtifactSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteGeneralArtifacts)
  @SetPolicy(Action.Update, Resource.GeneralArtifacts)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateArtifact(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateArtifactDto,
  ): Observable<ArtifactSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .updateOne(data, filter, { meta })
      .pipe(mapToInstance(ArtifactSerializer));
  }

  @Mutation(() => TotalSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageGeneralArtifacts)
  @SetPolicy(Action.Update, Resource.GeneralArtifacts)
  updateArtifacts(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateArtifactDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider
      .updateBulk(data, filter, { meta })
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
