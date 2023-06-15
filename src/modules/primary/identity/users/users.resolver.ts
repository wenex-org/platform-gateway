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
  UserSerializer,
  UsersSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateUserDto,
  FilterDto,
  OneFilterDto,
  UpdateUserDto,
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
import { UsersProvider } from '@app/common/providers';
import { Filter, Meta } from '@app/common/decorators';
import { Metadata } from '@app/common/interfaces';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@Resolver(() => UserSerializer)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class UsersResolver {
  constructor(private readonly provider: UsersProvider) {}

  @Query(() => TotalSerializer)
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(Action.Read, Resource.IdentityUsers)
  countUser(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .count(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(Action.Create, Resource.IdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  createUser(
    @Meta() meta: Metadata,
    @Args('data') data: CreateUserDto,
  ): Observable<UserSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Query(() => UsersSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(Action.Read, Resource.IdentityUsers)
  findUsers(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Observable<UsersSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UsersSerializer, 'array'));
  }

  @Query(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(Action.Read, Resource.IdentityUsers)
  findUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findById(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(Action.Delete, Resource.IdentityUsers)
  deleteUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(Action.Restore, Resource.IdentityUsers)
  restoreUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityUsers)
  @SetPolicy(Action.Destroy, Resource.IdentityUsers)
  destroyUser(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Mutation(() => UserSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(Action.Update, Resource.IdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  updateUser(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('data') data: UpdateUserDto,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Mutation(() => TotalSerializer)
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageIdentityUsers)
  @SetPolicy(Action.Update, Resource.IdentityUsers)
  updateUsers(
    @Meta() meta: Metadata,
    @Args('data') data: UpdateUserDto,
    @Filter() @Args('filter') filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
