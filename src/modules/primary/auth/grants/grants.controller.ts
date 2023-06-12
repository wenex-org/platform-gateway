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
  GrantSerializer,
  GrantsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateGrantDto,
  FilterDto,
  OneFilterDto,
  UpdateGrantDto,
} from '@app/common/dto';
import {
  AuthorityInterceptor,
  CreateInterceptor,
  FieldInterceptor,
  FilterInterceptor,
  MetadataTakeInterceptor,
  RateLimitInterceptor,
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
import { lastValueFrom, map, Observable } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { toRaw } from '@app/common/utils';
import { Metadata } from '@grpc/grpc-js';
import { Permission } from 'abacl';

import { GrantsProvider } from './grants.provider';

@ApiBearerAuth()
@ApiTags('grants')
@Controller('grants')
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
export class GrantsController {
  constructor(private readonly provider: GrantsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadGrants)
  @SetPolicy(SysAction.Read, Resource.Grants)
  @ApiQuery({ type: QueryFilterDto, required: false })
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
  @SetScope(Scope.WriteGrants)
  @UseInterceptors(CreateInterceptor)
  @SetPolicy(SysAction.Create, Resource.Grants)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  async create(
    @Meta() meta: Metadata,
    @Body() data: CreateGrantDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Get()
  @SetScope(Scope.ReadGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Read, Resource.Grants)
  @ApiQuery({ type: FilterDto, required: false })
  async findMany(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Promise<GrantsSerializer> {
    return GrantsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  @ApiResponse({ type: GrantSerializer, status: HttpStatus.OK })
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
            data: perm.filter(plainToInstance(GrantSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @SetScope(Scope.ReadGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Read, Resource.Grants)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async findById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<GrantSerializer> {
    Object.assign(filter.query, { _id: id });
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Delete(':id')
  @SetScope(Scope.WriteGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Delete, Resource.Grants)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async deleteById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<GrantSerializer> {
    Object.assign(filter.query, { _id: id });
    return GrantSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Put(':id/restore')
  @SetScope(Scope.WriteGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Restore, Resource.Grants)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async restoreById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<GrantSerializer> {
    Object.assign(filter.query, { _id: id });
    return GrantSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Delete(':id/destroy')
  @SetScope(Scope.ManageGrants)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Destroy, Resource.Grants)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async destroyById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<GrantSerializer> {
    Object.assign(filter.query, { _id: id });
    return GrantSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Patch(':id')
  @SetScope(Scope.WriteGrants)
  @SetPolicy(SysAction.Update, Resource.Grants)
  @ApiQuery({ type: OneFilterDto, required: false })
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  async updateById(
    @Meta() meta: Metadata,
    @Body() update: UpdateGrantDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<GrantSerializer> {
    Object.assign(filter.query, { _id: id });
    return GrantSerializer.build(
      await lastValueFrom(
        this.provider.service.updateById(
          { update, filter: toRaw(filter) },
          meta,
        ),
      ),
    );
  }

  @Patch('bulk')
  @SetScope(Scope.ManageGrants)
  @UseInterceptors(FieldInterceptor)
  @SetPolicy(SysAction.Update, Resource.Grants)
  @ApiQuery({ type: QueryFilterDto, required: false })
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() update: UpdateGrantDto,
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
