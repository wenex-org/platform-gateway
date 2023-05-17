import {
  CountSerializer,
  SessionSerializer,
  SessionsSerializer,
} from '@app/common/serializers';
import {
  CountFilterDto,
  CreateSessionDto,
  FilterDto,
  UpdateSessionDto,
} from '@app/common/dto';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CountFilter, OneFilter } from '@app/common/interfaces';
import { AllExceptionsFilter } from '@app/common/filters';
import { UseFilters, UsePipes } from '@nestjs/common';
import { toRaw } from '@app/common/utils';
import { lastValueFrom } from 'rxjs';

import { SessionsProvider } from './sessions.provider';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => SessionSerializer)
export class SessionsResolver {
  constructor(private readonly provider: SessionsProvider) {}

  @Query(() => CountSerializer, { name: 'countSession' })
  async count(
    @Args('filter', { type: () => CountFilterDto }) filter: CountFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter)))).count,
    );
  }

  @Mutation(() => SessionSerializer, { name: 'createSession' })
  async create(
    @Args({ name: 'data', type: () => CreateSessionDto })
    data: CreateSessionDto,
  ): Promise<SessionSerializer> {
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.create(data)),
    );
  }

  @Query(() => SessionSerializer, { name: 'findSession' })
  async findById(
    @Args('id', { type: () => String }, ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    const filter: OneFilter = { query: { _id: id } };
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter))),
    );
  }

  @Query(() => SessionsSerializer, { name: 'findSessions' })
  async findMany(
    @Args('filter', { type: () => FilterDto }) filter: FilterDto,
  ): Promise<SessionsSerializer> {
    return SessionsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter))))
        .items,
    );
  }

  @Query(() => SessionSerializer, { name: 'deleteSession' })
  async deleteById(
    @Args('id', { type: () => String }, ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    const filter: OneFilter = { query: { _id: id } };
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.deleteById(toRaw(filter))),
    );
  }

  @Query(() => SessionSerializer, { name: 'restoreSession' })
  async restoreById(
    @Args('id', { type: () => String }, ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    const filter: OneFilter = { query: { _id: id } };
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.restoreById(toRaw(filter))),
    );
  }

  @Query(() => SessionSerializer, { name: 'destroySession' })
  async destroyById(
    @Args('id', { type: () => String }, ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    const filter: OneFilter = { query: { _id: id } };
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.destroyById(toRaw(filter))),
    );
  }

  @Mutation(() => SessionSerializer, { name: 'updateSession' })
  async updateById(
    @Args('id', { type: () => String }, ParseMongoIdPipe) id: string,
    @Args({ name: 'update', type: () => UpdateSessionDto })
    update: UpdateSessionDto,
  ): Promise<SessionSerializer> {
    const filter: OneFilter = { query: { _id: id } };
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.updateById({ filter: toRaw(filter), update }),
      ),
    );
  }

  @Mutation(() => CountSerializer, { name: 'updateSessions' })
  async updateBulk(
    @Args('id', { type: () => String }, ParseMongoIdPipe) id: string,
    @Args({ name: 'update', type: () => CreateSessionDto })
    update: CreateSessionDto,
  ): Promise<CountSerializer> {
    const filter: CountFilter = { query: { _id: id } };
    return CountSerializer.build(
      (
        await lastValueFrom(
          this.provider.service.updateBulk({ filter: toRaw(filter), update }),
        )
      ).count,
    );
  }
}
