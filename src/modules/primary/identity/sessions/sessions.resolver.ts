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
  SessionSerializer,
  SessionsSerializer,
} from '@app/common/serializers';
import {
  CountFilterDto,
  CreateSessionDto,
  FilterDto,
  OneFilterDto,
  UpdateSessionDto,
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

import { SessionsProvider } from './sessions.provider';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => SessionSerializer)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class SessionsResolver {
  constructor(private readonly provider: SessionsProvider) {}

  @Query(() => CountSerializer)
  @SetScope(Scope.ReadIdentitySessions)
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  async countSession(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: CountFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter), meta)))
        .count,
    );
  }

  @Mutation(() => SessionSerializer)
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Create, Resource.IdentitySessions)
  async createSession(
    @Meta() meta: Metadata,
    @Args('data') data: CreateSessionDto,
  ): Promise<SessionSerializer> {
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Query(() => SessionsSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentitySessions)
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  async findSessions(
    @Meta() meta: Metadata,
    @Filter() @Args('filter') filter: FilterDto,
  ): Promise<SessionsSerializer> {
    return SessionsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Query(() => SessionSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentitySessions)
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  async findSession(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Mutation(() => SessionSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @SetPolicy(SysAction.Delete, Resource.IdentitySessions)
  async deleteSession(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => SessionSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @SetPolicy(SysAction.Restore, Resource.IdentitySessions)
  async restoreSession(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => SessionSerializer)
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentitySessions)
  @SetPolicy(SysAction.Destroy, Resource.IdentitySessions)
  async destroySession(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Mutation(() => SessionSerializer)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Update, Resource.IdentitySessions)
  async updateSession(
    @Args('id', ParseMongoIdPipe) id: string,
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Args('update') update: UpdateSessionDto,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
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
  @SetScope(Scope.ManageIdentitySessions)
  @SetPolicy(SysAction.Update, Resource.IdentitySessions)
  async updateSessions(
    @Meta() meta: Metadata,
    @Args('update') update: UpdateSessionDto,
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
