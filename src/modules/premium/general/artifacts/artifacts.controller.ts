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
  TotalSerializer,
  ArtifactSerializer,
  ArtifactsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
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
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@grpc/grpc-js';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

import { ArtifactsProvider } from './artifacts.provider';

@ApiBearerAuth()
@ApiTags('general')
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
  @ApiQuery({ type: QueryFilterDto, required: false })
  async count(@Filter() filter: QueryFilterDto): Promise<TotalSerializer> {
    return TotalSerializer.build(await this.provider.count(filter));
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
    return ArtifactSerializer.build(await this.provider.create(data, meta));
  }

  @Get()
  @SetScope(Scope.ReadArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Read, Resource.Artifacts)
  @ApiQuery({ type: FilterDto, required: false })
  async find(@Filter() filter: FilterDto): Promise<ArtifactsSerializer> {
    return ArtifactsSerializer.build(await this.provider.find(filter));
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentitySessions)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentitySessions)
  @ApiResponse({ type: ArtifactSerializer, status: HttpStatus.OK })
  cursor(
    @Perm() perm: Permission,
    @Filter() filter: OneFilterDto,
  ): Observable<MessageEvent> {
    return this.provider.cursor(filter).pipe(
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
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(await this.provider.findById(filter));
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
      await this.provider.deleteById(filter, meta),
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
      await this.provider.restoreById(filter, meta),
    );
  }

  @Delete(':id/destroy')
  @SetScope(Scope.ManageArtifacts)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(SysAction.Destroy, Resource.Artifacts)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  async destroyById(
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ArtifactSerializer> {
    Object.assign(filter.query, { _id: id });
    return ArtifactSerializer.build(await this.provider.destroyById(filter));
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
      await this.provider.updateById(filter, update, meta),
    );
  }

  @Patch('bulk')
  @SetScope(Scope.ManageArtifacts)
  @UseInterceptors(FieldInterceptor)
  @SetPolicy(SysAction.Update, Resource.Artifacts)
  @ApiQuery({ type: QueryFilterDto, required: false })
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() update: UpdateArtifactDto,
    @Filter() filter: QueryFilterDto,
  ): Promise<TotalSerializer> {
    return TotalSerializer.build(
      await this.provider.updateBulk(filter, update, meta),
    );
  }
}
