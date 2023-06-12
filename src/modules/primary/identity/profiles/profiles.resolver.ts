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
  MetadataTakeInterceptor,
  RateLimitInterceptor,
  UpdateInterceptor,
} from '@app/common/interceptors';
import {
  CountSerializer,
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
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Resource, Scope, SysAction } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { GraphqlInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { Filter, Meta } from '@app/common/decorators';
import { toRaw } from '@app/common/utils';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { ProfilesProvider } from './profiles.provider';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => ProfileSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class ProfilesResolver {
  constructor(private readonly provider: ProfilesProvider) {}

  @Query(() => CountSerializer)
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
  async countProfile(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter), meta)))
        .count,
    );
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Create, Resource.IdentityProfiles)
  async createProfile(
    @Meta() meta: Metadata,
    @Args('data', { type: () => CreateProfileDto }) data: CreateProfileDto,
  ): Promise<ProfileSerializer> {
    return ProfileSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Query(() => ProfilesSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
  async findProfiles(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Promise<ProfilesSerializer> {
    return ProfilesSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Query(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
  async findProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(SysAction.Delete, Resource.IdentityProfiles)
  async deleteProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(SysAction.Restore, Resource.IdentityProfiles)
  async restoreProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @SetPolicy(SysAction.Destroy, Resource.IdentityProfiles)
  async destroyProfile(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => ProfileSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Update, Resource.IdentityProfiles)
  async updateProfile(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('update') update: UpdateProfileDto,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.updateById(
          { update, filter: toRaw(filter) },
          meta,
        ),
      ),
    );
  }

  @Mutation(() => CountSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @SetPolicy(SysAction.Update, Resource.IdentityProfiles)
  async updateProfiles(
    @Meta() meta: Metadata,
    @Args('update') update: UpdateProfileDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (
        await lastValueFrom(
          this.provider.service.updateBulk(
            { update, filter: toRaw(filter) },
            meta,
          ),
        )
      ).count,
    );
  }
}
