import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Sse,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  CountSerializer,
  SessionSerializer,
  SessionsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateSessionDto,
  FilterDto,
  OneFilterDto,
  UpdateSessionDto,
} from '@app/common/dto';
import {
  AuthorityInterceptor,
  CreateInterceptor,
  FieldInterceptor,
  FilterInterceptor,
  MetadataTakeInterceptor,
  RateLimitInterceptor,
  UpdateInterceptor,
} from '@app/common/interceptors';
import {
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Resource, Scope, SysAction } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { Filter, Meta, Perm } from '@app/common/decorators';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { Observable, lastValueFrom, map } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { toRaw } from '@app/common/utils';
import { Metadata } from '@grpc/grpc-js';
import { Permission } from 'abacl';

import { SessionsProvider } from './sessions.provider';

@ApiBearerAuth()
@ApiTags('identity')
@Controller('sessions')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(RateLimitInterceptor)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  AuthorityInterceptor,
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
  new SentryInterceptor({ version: true }),
)
export class SessionsController {
  constructor(private readonly provider: SessionsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  async count(
    @Meta() meta: Metadata,
    @Filter() filter: QueryFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter), meta)))
        .count,
    );
  }

  @Post()
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Create, Resource.IdentitySessions)
  async create(
    @Meta() meta: Metadata,
    @Body() data: CreateSessionDto,
  ): Promise<SessionSerializer> {
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  async findMany(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Promise<SessionsSerializer> {
    return SessionsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  @ApiResponse({ type: SessionSerializer, status: HttpStatus.OK })
  cursor(
    @Meta() meta: Metadata,
    @Perm() perm: Permission,
    @Filter() filter: OneFilterDto,
  ): Observable<MessageEvent> {
    return this.provider.service.cursor(toRaw(filter), meta).pipe(
      map(
        (data) =>
          ({
            id: data.id,
            data: plainToInstance(SessionSerializer, perm.filter(data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  @ApiParam({ type: String, name: 'id', required: true })
  async findById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Delete, Resource.IdentitySessions)
  async deleteById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Restore, Resource.IdentitySessions)
  async restoreById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Destroy, Resource.IdentitySessions)
  async destroyById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Patch(':id')
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Update, Resource.IdentitySessions)
  async updateById(
    @Meta() meta: Metadata,
    @Body() update: UpdateSessionDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<SessionSerializer> {
    Object.assign(filter.query, { _id: id });
    return SessionSerializer.build(
      await lastValueFrom(
        this.provider.service.updateById(
          { update, filter: toRaw(filter) },
          meta,
        ),
      ),
    );
  }

  @Patch('bulk')
  @UseInterceptors(FieldInterceptor)
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.ManageIdentitySessions)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(SysAction.Update, Resource.IdentitySessions)
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() update: UpdateSessionDto,
    @Filter() filter: QueryFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (
        await lastValueFrom(
          this.provider.service.updateBulk(
            { update, filter: toRaw(filter) },
            meta,
          ),
        )
      ).count,
    );
  }
}
