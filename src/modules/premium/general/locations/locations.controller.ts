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
  LocationSerializer,
  LocationsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateLocationDto,
  FilterDto,
  OneFilterDto,
  UpdateLocationDto,
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
import { LocationsProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@app/common/interfaces';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('locations')
@Controller('locations')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class LocationsController {
  constructor(private readonly provider: LocationsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadGeneralLocations)
  @SetPolicy(Action.Read, Resource.GeneralLocations)
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
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @SetPolicy(Action.Create, Resource.GeneralLocations)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  create(
    @Meta() meta: Metadata,
    @Body() data: CreateLocationDto,
  ): Observable<LocationSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadGeneralLocations)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(Action.Read, Resource.GeneralLocations)
  find(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Observable<LocationsSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationsSerializer, 'array'));
  }

  @Sse('sse')
  @SetScope(Scope.ReadGeneralLocations)
  @SetPolicy(Action.Read, Resource.GeneralLocations)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiResponse({ type: LocationSerializer, status: HttpStatus.OK })
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
            data: perm.filter(plainToInstance(LocationSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadGeneralLocations)
  @SetPolicy(Action.Read, Resource.GeneralLocations)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  findOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Delete, Resource.GeneralLocations)
  @ApiParam({ type: String, name: 'id', required: true })
  deleteOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteGeneralLocations)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Restore, Resource.GeneralLocations)
  @ApiParam({ type: String, name: 'id', required: true })
  restoreOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageGeneralLocations)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Destroy, Resource.GeneralLocations)
  @ApiParam({ type: String, name: 'id', required: true })
  destroyOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Patch(':id')
  @SetScope(Scope.WriteGeneralLocations)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.GeneralLocations)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  updateOne(
    @Meta() meta: Metadata,
    @Body() data: UpdateLocationDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<LocationSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(LocationSerializer));
  }

  @Patch('bulk')
  @UseInterceptors(FieldInterceptor)
  @SetScope(Scope.ManageGeneralLocations)
  @SetPolicy(Action.Update, Resource.GeneralLocations)
  @ApiQuery({ type: QueryFilterDto, required: false })
  updateBulk(
    @Meta() meta: Metadata,
    @Body() data: UpdateLocationDto,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
