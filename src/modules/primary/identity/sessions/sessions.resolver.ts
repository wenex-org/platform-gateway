import {
  CountSerializer,
  SessionSerializer,
  SessionsSerializer,
} from '@app/common/serializers';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ValidationPipe } from '@app/common/pipes';
import { OneFilter } from '@app/common/interfaces';
import { CountFilterDto } from '@app/common/dto';
import { UsePipes } from '@nestjs/common';
import { toRaw } from '@app/common/utils';
import { lastValueFrom } from 'rxjs';

import { SessionsProvider } from './sessions.provider';

@UsePipes(ValidationPipe)
@Resolver(() => SessionSerializer)
export class SessionsResolver {
  constructor(private readonly provider: SessionsProvider) {}

  @Query(() => CountSerializer)
  async sessionCount(
    @Args('filter', { type: () => CountFilterDto }) filter: CountFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter)))).count,
    );
  }

  @Query(() => SessionSerializer)
  async session(
    @Args('id', { type: () => String }) id: string,
  ): Promise<SessionSerializer> {
    const filter: OneFilter = { query: { _id: id } };
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter))),
    );
  }

  @Query(() => SessionsSerializer)
  async sessions(): Promise<SessionsSerializer> {
    return SessionsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw({})))).items,
    );
  }
}
