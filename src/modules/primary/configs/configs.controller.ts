import {
  Body,
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
  ConfigSerializer,
  ConfigsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateConfigDto,
  FilterDto,
  OneFilterDto,
  UpdateConfigDto,
} from '@app/common/dto';
import {
  AuthorityInterceptor,
  CreateInterceptor,
  FieldInterceptor,
  FilterInterceptor,
  RateLimitInterceptor,
  SetMetadataInterceptor,
} from '@app/common/interceptors';
import {
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  assignIdToFilterQuery,
  mapToInstance,
  toGrpcMeta,
  toRaw,
} from '@app/common/utils';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Resource, Scope, Action } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { Filter, Meta, Perm } from '@app/common/decorators';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { ConfigsProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@app/common/interfaces';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('configs')
@Controller('configs')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class ConfigsController {
  constructor(private readonly provider: ConfigsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadConfigs)
  @SetPolicy(Action.Read, Resource.Configs)
  @ApiQuery({ type: QueryFilterDto, required: false })
  count(
    @Meta() meta: Metadata,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .count(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Post()
  @SetScope(Scope.WriteConfigs)
  @UseInterceptors(CreateInterceptor)
  @SetPolicy(Action.Create, Resource.Configs)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  create(
    @Meta() meta: Metadata,
    @Body() data: CreateConfigDto,
  ): Observable<ConfigSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @Get()
  @SetScope(Scope.ReadConfigs)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Read, Resource.Configs)
  @ApiQuery({ type: FilterDto, required: false })
  find(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Observable<ConfigsSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigsSerializer, 'array'));
  }

  @Sse('sse')
  @SetScope(Scope.ReadConfigs)
  @SetPolicy(Action.Read, Resource.Configs)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiResponse({ type: ConfigSerializer, status: HttpStatus.OK })
  cursor(
    @Meta() meta: Metadata,
    @Perm() perm: Permission,
    @Filter() filter: OneFilterDto,
  ): Observable<MessageEvent> {
    return this.provider.service.cursor(toRaw(filter), toGrpcMeta(meta)).pipe(
      map(
        (data) =>
          ({
            id: data.id,
            data: perm.filter(plainToInstance(ConfigSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @SetScope(Scope.ReadConfigs)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Read, Resource.Configs)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  findOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @Delete(':id')
  @SetScope(Scope.WriteConfigs)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Delete, Resource.Configs)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  deleteOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @Put(':id/restore')
  @SetScope(Scope.WriteConfigs)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Restore, Resource.Configs)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  restoreOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @Delete(':id/destroy')
  @SetScope(Scope.ManageConfigs)
  @UseInterceptors(FilterInterceptor)
  @SetPolicy(Action.Destroy, Resource.Configs)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  destroyOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @Patch(':id')
  @SetScope(Scope.WriteConfigs)
  @SetPolicy(Action.Update, Resource.Configs)
  @ApiQuery({ type: OneFilterDto, required: false })
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  updateOne(
    @Meta() meta: Metadata,
    @Body() data: UpdateConfigDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ConfigSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(ConfigSerializer));
  }

  @Patch('bulk')
  @SetScope(Scope.ManageConfigs)
  @UseInterceptors(FieldInterceptor)
  @SetPolicy(Action.Update, Resource.Configs)
  @ApiQuery({ type: QueryFilterDto, required: false })
  updateBulk(
    @Meta() meta: Metadata,
    @Body() data: UpdateConfigDto,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
