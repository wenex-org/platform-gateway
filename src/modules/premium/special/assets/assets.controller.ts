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
  AssetSerializer,
  AssetsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateAssetDto,
  FilterDto,
  OneFilterDto,
  UpdateAssetDto,
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
import { assignIdToFilterQuery, mapToInstance } from '@app/common/utils';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { Resource, Scope, Action } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { Filter, Meta, Perm } from '@app/common/decorators';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { AssetsProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@app/common/interfaces';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('assets')
@Controller('assets')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class AssetsController {
  constructor(private readonly provider: AssetsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadSpecialAssets)
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  @ApiQuery({ type: QueryFilterDto, required: false })
  count(
    @Meta() meta: Metadata,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider
      .count(filter, { meta })
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }

  @Post()
  @UseInterceptors(CreateInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @SetPolicy(Action.Create, Resource.SpecialAssets)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  create(
    @Meta() meta: Metadata,
    @Body() data: CreateAssetDto,
  ): Observable<AssetSerializer> {
    return this.provider
      .create(data, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadSpecialAssets)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  find(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Observable<AssetsSerializer> {
    return this.provider
      .find(filter, { meta })
      .pipe(mapToInstance(AssetsSerializer, 'array'));
  }

  @Sse('sse')
  @SetScope(Scope.ReadSpecialAssets)
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiResponse({ type: AssetSerializer, status: HttpStatus.OK })
  cursor(
    @Meta() meta: Metadata,
    @Perm() perm: Permission,
    @Filter() filter: OneFilterDto,
  ): Observable<MessageEvent> {
    return this.provider.cursor(filter, { meta }).pipe(
      map(
        (data) =>
          ({
            id: data.value.id,
            data: perm.filter(plainToInstance(AssetSerializer, data.value)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadSpecialAssets)
  @SetPolicy(Action.Read, Resource.SpecialAssets)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  findOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .findOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Delete, Resource.SpecialAssets)
  @ApiParam({ type: String, name: 'id', required: true })
  deleteOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .deleteOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteSpecialAssets)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Restore, Resource.SpecialAssets)
  @ApiParam({ type: String, name: 'id', required: true })
  restoreOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .restoreOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageSpecialAssets)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Destroy, Resource.SpecialAssets)
  @ApiParam({ type: String, name: 'id', required: true })
  destroyOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .destroyOne(filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Patch(':id')
  @SetScope(Scope.WriteSpecialAssets)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.SpecialAssets)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  updateOne(
    @Meta() meta: Metadata,
    @Body() data: UpdateAssetDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<AssetSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider
      .updateOne(data, filter, { meta })
      .pipe(mapToInstance(AssetSerializer));
  }

  @Patch('bulk')
  @UseInterceptors(FieldInterceptor)
  @SetScope(Scope.ManageSpecialAssets)
  @SetPolicy(Action.Update, Resource.SpecialAssets)
  @ApiQuery({ type: QueryFilterDto, required: false })
  updateBulk(
    @Meta() meta: Metadata,
    @Body() data: UpdateAssetDto,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider
      .updateBulk(data, filter, { meta })
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
