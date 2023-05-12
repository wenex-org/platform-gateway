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
import { AuthenticationDto, TokenDto } from '@app/common/dto';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ValidationPipe } from '@app/common/pipes';
import { ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';

import { AuthenticationProvider } from './authentication.provider';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(
  ClassSerializerInterceptor,
  new SentryInterceptor({ version: true }),
)
export class AuthenticationController {
  constructor(private readonly provider: AuthenticationProvider) {}

  @Post('token')
  async token(
    @Body() data: AuthenticationDto,
  ): Promise<AuthenticationSerializer> {
    return AuthenticationSerializer.build(
      await lastValueFrom(this.provider.service.token(data)),
    );
  }

  @Post('logout')
  async logout(@Body() token: TokenDto): Promise<ResultSerializer> {
    return ResultSerializer.build(
      (await lastValueFrom(this.provider.service.logout(token))).result,
    );
  }

  @Post('decrypt')
  async decrypt(@Body() token: TokenDto): Promise<JwtTokenSerializer> {
    return JwtTokenSerializer.build(
      await lastValueFrom(this.provider.service.decrypt(token)),
    );
  }
}
