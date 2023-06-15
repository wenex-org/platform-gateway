import {
  RateLimitInterceptor,
  SetMetadataInterceptor,
} from '@app/common/interceptors';
import {
  ClassSerializerInterceptor,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AuthorizationSerializer } from '@app/common/serializers';
import { AuthorizationProvider } from '@app/common/providers';
import { mapToInstance, toGrpcMeta } from '@app/common/utils';
import { GraphqlInterceptor } from '@ntegral/nestjs-sentry';
import { AuthGuard, ScopeGuard } from '@app/common/guards';
import { AllExceptionsFilter } from '@app/common/filters';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Filter, Meta } from '@app/common/decorators';
import { AuthorizationDto } from '@app/common/dto';
import { ValidationPipe } from '@app/common/pipes';
import { Metadata } from '@app/common/interfaces';
import { SetScope } from '@app/common/metadatas';
import { Scope } from '@app/common/enums';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard)
@UseInterceptors(RateLimitInterceptor)
@Resolver(() => AuthorizationSerializer)
@UseInterceptors(
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class AuthorizationResolver {
  constructor(private readonly provider: AuthorizationProvider) {}

  @SetScope(Scope.ManageAuth)
  @Query(() => AuthorizationSerializer)
  can(
    @Meta() meta: Metadata,
    @Filter() @Args('data') data: AuthorizationDto,
  ): Observable<AuthorizationSerializer> {
    return this.provider.service
      .can(data, toGrpcMeta(meta))
      .pipe(mapToInstance(AuthorizationSerializer));
  }
}
