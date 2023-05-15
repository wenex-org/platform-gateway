import {
  Body,
  ClassSerializerInterceptor,
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
import { MetadataTakeInterceptor } from '@app/common/interceptors';
import { AuthenticationProvider } from '@app/common/providers';
import { AuthenticationDto, TokenDto } from '@app/common/dto';
import { AuthGuard, ScopeGuard } from '@app/common/guards';
import { IsPublic, SetScope } from '@app/common/metadatas';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '@app/common/pipes';
import { Meta } from '@app/common/decorators';
import { Scope } from '@app/common/enums';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

@ApiTags('auth')
@Controller('auth')
@UseGuards(AuthGuard)
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
  new SentryInterceptor({ version: true }),
)
export class AuthenticationController {
  constructor(private readonly provider: AuthenticationProvider) {}

  @IsPublic()
  @Post('token')
  async token(
    @Meta() meta: Metadata,
    @Body() data: AuthenticationDto,
  ): Promise<AuthenticationSerializer> {
    return AuthenticationSerializer.build(
      await lastValueFrom(this.provider.service.token(data, meta)),
    );
  }

  @Post('logout')
  @ApiBearerAuth()
  @SetScope(Scope.Auth)
  @UseGuards(ScopeGuard)
  async logout(
    @Meta() meta: Metadata,
    @Body() token: TokenDto,
  ): Promise<ResultSerializer> {
    return ResultSerializer.build(
      (await lastValueFrom(this.provider.service.logout(token, meta))).result,
    );
  }

  @Post('decrypt')
  @ApiBearerAuth()
  @SetScope(Scope.Auth)
  @UseGuards(ScopeGuard)
  async decrypt(
    @Meta() meta: Metadata,
    @Body() token: TokenDto,
  ): Promise<JwtTokenSerializer> {
    return JwtTokenSerializer.build(
      await lastValueFrom(this.provider.service.decrypt(token, meta)),
    );
  }
}
