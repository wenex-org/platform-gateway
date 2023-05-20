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
  UserSerializer,
  UsersSerializer,
} from '@app/common/serializers';
import {
  CountFilterDto,
  CreateUserDto,
  FilterDto,
  OneFilterDto,
  UpdateUserDto,
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

import { UsersProvider } from './users.provider';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => UserSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class UsersResolver {
  constructor(private readonly provider: UsersProvider) {}

  @Query(() => CountSerializer)
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
  async countUser(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: CountFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter), meta)))
        .count,
    );
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Create, Resource.IdentityUsers)
  async createUser(
    @Meta() meta: Metadata,
    @Args('data') data: CreateUserDto,
  ): Promise<UserSerializer> {
    return UserSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Query(() => UsersSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
  async findUsers(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Promise<UsersSerializer> {
    return UsersSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Query(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
  async findUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(SysAction.Delete, Resource.IdentityUsers)
  async deleteUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(SysAction.Restore, Resource.IdentityUsers)
  async restoreUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityUsers)
  @SetPolicy(SysAction.Destroy, Resource.IdentityUsers)
  async destroyUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Update, Resource.IdentityUsers)
  async updateUser(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('update') update: UpdateUserDto,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
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
  @SetScope(Scope.ManageIdentityUsers)
  @SetPolicy(SysAction.Update, Resource.IdentityUsers)
  async updateUsers(
    @Meta() meta: Metadata,
    @Args('update') update: UpdateUserDto,
    @Filter() @Args('filter') filter: CountFilterDto,
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
