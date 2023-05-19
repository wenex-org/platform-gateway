import {
  ClassSerializerInterceptor,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  GqlAuthorityInterceptor,
  MetadataTakeInterceptor,
  RateLimitInterceptor,
} from '@app/common/interceptors';
import { CountSerializer, SessionSerializer } from '@app/common/serializers';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { Resource, Scope, SysAction } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { AllExceptionsFilter } from '@app/common/filters';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Filter, Meta } from '@app/common/decorators';
import { ValidationPipe } from '@app/common/pipes';
import { CountFilterDto } from '@app/common/dto';
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
  GqlAuthorityInterceptor,
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
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
}
