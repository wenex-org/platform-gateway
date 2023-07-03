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
  ClientSerializer,
  ClientsSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateClientDto,
  FilterDto,
  OneFilterDto,
  UpdateClientDto,
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
import { ClientsProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@app/common/interfaces';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('clients')
@Controller('clients')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class ClientsController {
  constructor(private readonly provider: ClientsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadDomainClients)
  @SetPolicy(Action.Read, Resource.DomainClients)
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
  @SetScope(Scope.WriteDomainClients)
  @SetPolicy(Action.Create, Resource.DomainClients)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  create(
    @Meta() meta: Metadata,
    @Body() data: CreateClientDto,
  ): Observable<ClientSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ClientSerializer));
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadDomainClients)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(Action.Read, Resource.DomainClients)
  find(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Observable<ClientsSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ClientsSerializer, 'array'));
  }

  @Sse('sse')
  @SetScope(Scope.ReadDomainClients)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Read, Resource.DomainClients)
  @ApiResponse({ type: ClientSerializer, status: HttpStatus.OK })
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
            data: perm.filter(plainToInstance(ClientSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadDomainClients)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Read, Resource.DomainClients)
  @ApiParam({ type: String, name: 'id', required: true })
  findOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ClientSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ClientSerializer));
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteDomainClients)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Delete, Resource.DomainClients)
  @ApiParam({ type: String, name: 'id', required: true })
  deleteOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ClientSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ClientSerializer));
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteDomainClients)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Restore, Resource.DomainClients)
  @ApiParam({ type: String, name: 'id', required: true })
  restoreOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ClientSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ClientSerializer));
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageDomainClients)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Destroy, Resource.DomainClients)
  @ApiParam({ type: String, name: 'id', required: true })
  destroyOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ClientSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ClientSerializer));
  }

  @Patch(':id')
  @SetScope(Scope.WriteDomainClients)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.DomainClients)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  updateOne(
    @Meta() meta: Metadata,
    @Body() data: UpdateClientDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ClientSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(ClientSerializer));
  }

  @Patch('bulk')
  @UseInterceptors(FieldInterceptor)
  @SetScope(Scope.ManageDomainClients)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.DomainClients)
  updateBulk(
    @Meta() meta: Metadata,
    @Body() data: UpdateClientDto,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
