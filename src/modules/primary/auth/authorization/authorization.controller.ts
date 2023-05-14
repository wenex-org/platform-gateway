import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseFilters,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { AuthorizationSerializer } from '@app/common/serializers';
import { MetadataInterceptor } from '@app/common/interceptors';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { AuthorizationDto } from '@app/common/dto';
import { ValidationPipe } from '@app/common/pipes';
import { Meta } from '@app/common/decorators';
import { ApiTags } from '@nestjs/swagger';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { AuthorizationProvider } from './authorization.provider';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(
  MetadataInterceptor,
  ClassSerializerInterceptor,
  new SentryInterceptor({ version: true }),
)
export class AuthorizationController {
  constructor(private readonly provider: AuthorizationProvider) {}

  @Post('can')
  async can(
    @Meta() meta: Metadata,
    @Body() data: AuthorizationDto,
  ): Promise<AuthorizationSerializer> {
    return AuthorizationSerializer.build(
      await lastValueFrom(this.provider.service.can(data, meta)),
    );
  }
}
