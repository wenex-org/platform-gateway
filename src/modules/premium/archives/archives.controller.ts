import {
  Controller,
  HttpStatus,
  Sse,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  AuthorityInterceptor,
  RateLimitInterceptor,
  SetMetadataInterceptor,
} from '@app/common/interceptors';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { CassandraFilterDto, OneFilterDto } from '@app/common/dto';
import { Resource, Scope, Action } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { Filter, Meta, Perm } from '@app/common/decorators';
import { ArchiveSerializer } from '@app/common/serializers';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ArchivesProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { ValidationPipe } from '@app/common/pipes';
import { Metadata } from '@app/common/interfaces';
import { toGrpcMeta } from '@app/common/utils';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('archives')
@Controller('archives')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class ArchivesController {
  constructor(private readonly provider: ArchivesProvider) {}

  @Sse('sse')
  @SetScope(Scope.ReadArchives)
  @SetPolicy(Action.Read, Resource.Archives)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiResponse({ type: ArchiveSerializer, status: HttpStatus.OK })
  cursor(
    @Meta() meta: Metadata,
    @Perm() perm: Permission,
    @Filter() filter: CassandraFilterDto,
  ): Observable<MessageEvent> {
    return this.provider.service.cursor(filter, toGrpcMeta(meta)).pipe(
      map(
        (data) =>
          ({
            id: data.id,
            data: perm.filter(plainToInstance(ArchiveSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }
}
