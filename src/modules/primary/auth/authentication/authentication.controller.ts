import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseFilters,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  AuthenticationSerializer,
  JwtTokenSerializer,
  ResultSerializer,
} from '@app/common/serializers';
import { MetadataInterceptor } from '@app/common/interceptors';
import { AuthenticationDto, TokenDto } from '@app/common/dto';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ValidationPipe } from '@app/common/pipes';
import { Meta } from '@app/common/decorators';
import { ApiTags } from '@nestjs/swagger';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { AuthenticationProvider } from '../../../../../../../libs/common/src/providers/auth/authentication.provider';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(
  MetadataInterceptor,
  ClassSerializerInterceptor,
  new SentryInterceptor({ version: true }),
)
export class AuthenticationController {
  constructor(private readonly provider: AuthenticationProvider) {}

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
  async logout(
    @Meta() meta: Metadata,
    @Body() token: TokenDto,
  ): Promise<ResultSerializer> {
    return ResultSerializer.build(
      (await lastValueFrom(this.provider.service.logout(token, meta))).result,
    );
  }

  @Post('decrypt')
  async decrypt(
    @Meta() meta: Metadata,
    @Body() token: TokenDto,
  ): Promise<JwtTokenSerializer> {
    return JwtTokenSerializer.build(
      await lastValueFrom(this.provider.service.decrypt(token, meta)),
    );
  }
}
