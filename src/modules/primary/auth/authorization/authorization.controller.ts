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
import { MetadataTakeInterceptor } from '@app/common/interceptors';
import { AuthorizationSerializer } from '@app/common/serializers';
import { AuthorizationProvider } from '@app/common/providers';
import { AuthGuard, ScopeGuard } from '@app/common/guards';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthorizationDto } from '@app/common/dto';
import { ValidationPipe } from '@app/common/pipes';
import { SetScope } from '@app/common/metadatas';
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
export class AuthorizationController {
  constructor(private readonly provider: AuthorizationProvider) {}

  @Post('can')
  @ApiBearerAuth()
  @SetScope(Scope.Auth)
  @UseGuards(ScopeGuard)
  async can(
    @Meta() meta: Metadata,
    @Body() data: AuthorizationDto,
  ): Promise<AuthorizationSerializer> {
    return AuthorizationSerializer.build(
      await lastValueFrom(this.provider.service.can(data, meta)),
    );
  }
}
