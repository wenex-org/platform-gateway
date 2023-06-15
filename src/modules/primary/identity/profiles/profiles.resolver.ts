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
  ProfileSerializer,
  ProfilesSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateProfileDto,
  FilterDto,
  OneFilterDto,
  UpdateProfileDto,
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
import { ProfilesProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => ProfileSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class ProfilesResolver {
  constructor(private readonly provider: ProfilesProvider) {}

  @Query(() => TotalSerializer)
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
  countProfile(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .count(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(Action.Create, Resource.IdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createProfile(
    @Meta() meta: Metadata,
    @Args('data') data: CreateProfileDto,
  ): Observable<ProfileSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Query(() => ProfilesSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
  findProfiles(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<ProfilesSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfilesSerializer, 'array'));
  }

  @Query(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
  findProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findById(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(Action.Delete, Resource.IdentityProfiles)
  deleteProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(Action.Restore, Resource.IdentityProfiles)
  restoreProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @SetPolicy(Action.Destroy, Resource.IdentityProfiles)
  destroyProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(Action.Update, Resource.IdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateProfile(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateProfileDto,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Mutation(() => TotalSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @SetPolicy(Action.Update, Resource.IdentityProfiles)
  updateProfiles(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateProfileDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
