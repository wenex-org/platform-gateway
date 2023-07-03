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
  SetMetadataInterceptor,
  RateLimitInterceptor,
} from '@app/common/interceptors';
import { AuthorizationSerializer } from '@app/common/serializers';
import { mapToInstance, toGrpcMeta } from '@app/common/utils';
import { AuthorizationProvider } from '@app/common/providers';
import { AuthGuard, ScopeGuard } from '@app/common/guards';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthorizationDto } from '@app/common/dto';
import { ValidationPipe } from '@app/common/pipes';
import { Metadata } from '@app/common/interfaces';
import { SetScope } from '@app/common/metadatas';
import { Meta } from '@app/common/decorators';
import { Scope } from '@app/common/enums';
import { Observable } from 'rxjs';

@ApiBearerAuth()
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
export class AuthorizationController {
  constructor(private readonly provider: AuthorizationProvider) {}

  @Post('can')
  @SetScope(Scope.ManageAuth)
  can(
    @Meta() meta: Metadata,
    @Body() data: AuthorizationDto,
  ): Observable<AuthorizationSerializer> {
    return this.provider.service
      .can(data, toGrpcMeta(meta))
      .pipe(mapToInstance(AuthorizationSerializer));
  }
}
