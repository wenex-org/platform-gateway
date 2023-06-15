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
import {
  AuthenticationSerializer,
  JwtTokenSerializer,
  ResultSerializer,
} from '@app/common/serializers';
import { AuthenticationProvider } from '@app/common/providers';
import { AuthenticationDto, TokenDto } from '@app/common/dto';
import { mapToInstance, toGrpcMeta } from '@app/common/utils';
import { GraphqlInterceptor } from '@ntegral/nestjs-sentry';
import { AuthGuard, ScopeGuard } from '@app/common/guards';
import { IsPublic, SetScope } from '@app/common/metadatas';
import { AllExceptionsFilter } from '@app/common/filters';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Filter, Meta } from '@app/common/decorators';
import { ValidationPipe } from '@app/common/pipes';
import { Metadata } from '@app/common/interfaces';
import { Scope } from '@app/common/enums';
import { Observable } from 'rxjs';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard)
@UseInterceptors(RateLimitInterceptor)
@Resolver(() => AuthenticationSerializer)
@UseInterceptors(
  SetMetadataInterceptor,
  ClassSerializerInterceptor,
  new GraphqlInterceptor({ version: true }),
)
export class AuthenticationResolver {
  constructor(private readonly provider: AuthenticationProvider) {}

  @IsPublic()
  @Query(() => AuthenticationSerializer)
  authToken(
    @Meta() meta: Metadata,
    @Filter() @Args('data') data: AuthenticationDto,
  ): Observable<AuthenticationSerializer> {
    return this.provider.service
      .token(data, toGrpcMeta(meta))
      .pipe(mapToInstance(AuthenticationSerializer));
  }

  @SetScope(Scope.ManageAuth)
  @Query(() => JwtTokenSerializer)
  authDecrypt(
    @Meta() meta: Metadata,
    @Filter() @Args('data') data: TokenDto,
  ): Observable<JwtTokenSerializer> {
    return this.provider.service
      .decrypt(data, toGrpcMeta(meta))
      .pipe(mapToInstance(JwtTokenSerializer));
  }

  @SetScope(Scope.ManageAuth)
  @Query(() => ResultSerializer)
  authLogout(
    @Meta() meta: Metadata,
    @Filter() @Args('data') data: TokenDto,
  ): Observable<ResultSerializer> {
    return this.provider.service
      .logout(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ResultSerializer, 'result'));
  }
}
