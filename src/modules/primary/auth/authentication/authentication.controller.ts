import {
  Body,
  Controller,
  Post,
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
import {
  SetMetadataInterceptor,
  RateLimitInterceptor,
} from '@app/common/interceptors';
import { AuthenticationProvider } from '@app/common/providers';
import { AuthenticationDto, TokenDto } from '@app/common/dto';
import { mapToInstance, toGrpcMeta } from '@app/common/utils';
import { AuthGuard, ScopeGuard } from '@app/common/guards';
import { IsPublic, SetScope } from '@app/common/metadatas';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@app/common/pipes';
import { Metadata } from '@app/common/interfaces';
import { Meta } from '@app/common/decorators';
import { Scope } from '@app/common/enums';
import { Observable } from 'rxjs';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class AuthenticationController {
  constructor(private readonly provider: AuthenticationProvider) {}

  @IsPublic()
  @Post('token')
  token(
    @Meta() meta: Metadata,
    @Body() data: AuthenticationDto,
  ): Observable<AuthenticationSerializer> {
    return this.provider.service
      .token(data, toGrpcMeta(meta))
      .pipe(mapToInstance(AuthenticationSerializer));
  }

  @Post('decrypt')
  @ApiBearerAuth()
  @SetScope(Scope.ManageAuth)
  decrypt(
    @Meta() meta: Metadata,
    @Body() data: TokenDto,
  ): Observable<JwtTokenSerializer> {
    return this.provider.service
      .decrypt(data, toGrpcMeta(meta))
      .pipe(mapToInstance(JwtTokenSerializer));
  }

  @Post('logout')
  @ApiBearerAuth()
  @SetScope(Scope.ManageAuth)
  logout(
    @Meta() meta: Metadata,
    @Body() data: TokenDto,
  ): Observable<ResultSerializer> {
    return this.provider.service
      .logout(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ResultSerializer, 'result'));
  }
}
