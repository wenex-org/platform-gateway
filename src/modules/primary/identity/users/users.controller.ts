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
  UserSerializer,
  UsersSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateUserDto,
  FilterDto,
  OneFilterDto,
  UpdateUserDto,
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
import { UsersProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@app/common/interfaces';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class UsersController {
  constructor(private readonly provider: UsersProvider) {}

  @Get('count')
  @SetScope(Scope.ReadIdentityUsers)
  @SetPolicy(Action.Read, Resource.IdentityUsers)
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
  @SetScope(Scope.WriteIdentityUsers)
  @SetPolicy(Action.Create, Resource.IdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  create(
    @Meta() meta: Metadata,
    @Body() data: CreateUserDto,
  ): Observable<UserSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(Action.Read, Resource.IdentityUsers)
  find(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Observable<UsersSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UsersSerializer, 'array'));
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Read, Resource.IdentityUsers)
  @ApiResponse({ type: UserSerializer, status: HttpStatus.OK })
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
            data: perm.filter(plainToInstance(UserSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Read, Resource.IdentityUsers)
  @ApiParam({ type: String, name: 'id', required: true })
  findOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Delete, Resource.IdentityUsers)
  @ApiParam({ type: String, name: 'id', required: true })
  deleteOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Restore, Resource.IdentityUsers)
  @ApiParam({ type: String, name: 'id', required: true })
  restoreOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Destroy, Resource.IdentityUsers)
  @ApiParam({ type: String, name: 'id', required: true })
  destroyOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Patch(':id')
  @SetScope(Scope.WriteIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.IdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  updateOne(
    @Meta() meta: Metadata,
    @Body() data: UpdateUserDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<UserSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(UserSerializer));
  }

  @Patch('bulk')
  @UseInterceptors(FieldInterceptor)
  @SetScope(Scope.ManageIdentityUsers)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.IdentityUsers)
  updateBulk(
    @Meta() meta: Metadata,
    @Body() data: UpdateUserDto,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
