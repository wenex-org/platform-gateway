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
  ArtifactSerializer,
  ArtifactsSerializer,
} from '@app/common/serializers';
import {
  CountFilterDto,
  CreateArtifactDto,
  FilterDto,
  OneFilterDto,
  UpdateArtifactDto,
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

import { ArtifactsProvider } from './artifacts.provider';

@ApiBearerAuth()
@ApiTags('artifacts')
@Controller('artifacts')
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
export class ArtifactsController {
  constructor(private readonly provider: ArtifactsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadArtifacts)
  @SetPolicy(SysAction.Read, Resource.Artifacts)
  @ApiQuery({ type: CountFilterDto, required: false })
  async count(
    @Meta() meta: Metadata,
    @Filter() filter: CountFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(filter), meta)))
        .count,
    );
  }

  @Post()
  @SetScope(Scope.WriteArtifacts)
  @UseInterceptors(CreateInterceptor)
  @SetPolicy(SysAction.Create, Resource.Artifacts)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  async create(
    @Meta() meta: Metadata,
    @Body() data: CreateArtifactDto,
  ): Promise<ArtifactSerializer> {
    return ArtifactSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Get()
  @SetScope(Scope.ReadArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Read, Resource.Artifacts)
  @ApiQuery({ type: FilterDto, required: false })
  async findMany(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Promise<ArtifactsSerializer> {
    return ArtifactsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  @ApiResponse({ type: ArtifactSerializer, status: HttpStatus.OK })
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
            data: perm.filter(plainToInstance(ArtifactSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @SetScope(Scope.ReadArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Read, Resource.Artifacts)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async findById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Delete(':id')
  @SetScope(Scope.WriteArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Delete, Resource.Artifacts)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async deleteById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Put(':id/restore')
  @SetScope(Scope.WriteArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Restore, Resource.Artifacts)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async restoreById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Delete(':id/destroy')
  @SetScope(Scope.ManageArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Destroy, Resource.Artifacts)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async destroyById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Patch(':id')
  @SetScope(Scope.WriteArtifacts)
  @SetPolicy(SysAction.Update, Resource.Artifacts)
  @ApiQuery({ type: OneFilterDto, required: false })
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  async updateById(
    @Meta() meta: Metadata,
    @Body() update: UpdateArtifactDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(
      await lastValueFrom(
        this.provider.service.updateById(
          { update, filter: toRaw(filter) },
          meta,
        ),
      ),
    );
  }

  @Patch('bulk')
  @SetScope(Scope.ManageArtifacts)
  @UseInterceptors(FieldInterceptor)
  @SetPolicy(SysAction.Update, Resource.Artifacts)
  @ApiQuery({ type: CountFilterDto, required: false })
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() update: UpdateArtifactDto,
    @Filter() filter: CountFilterDto,
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
