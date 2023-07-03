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
  ProfileSerializer,
  ProfilesSerializer,
} from '@app/common/serializers';
import {
  QueryFilterDto,
  CreateProfileDto,
  FilterDto,
  OneFilterDto,
  UpdateProfileDto,
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
import { ProfilesProvider } from '@app/common/providers';
import { plainToInstance } from 'class-transformer';
import { Metadata } from '@app/common/interfaces';
import { map, Observable } from 'rxjs';
import { Permission } from 'abacl';

@ApiBearerAuth()
@ApiTags('profiles')
@Controller('profiles')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class ProfilesController {
  constructor(private readonly provider: ProfilesProvider) {}

  @Get('count')
  @SetScope(Scope.ReadIdentityProfiles)
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
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
  @SetScope(Scope.WriteIdentityProfiles)
  @SetPolicy(Action.Create, Resource.IdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  create(
    @Meta() meta: Metadata,
    @Body() data: CreateProfileDto,
  ): Observable<ProfileSerializer> {
    return this.provider.service
      .create(data, toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
  find(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Observable<ProfilesSerializer> {
    return this.provider.service
      .find(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfilesSerializer, 'array'));
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
  @ApiResponse({ type: ProfileSerializer, status: HttpStatus.OK })
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
            data: perm.filter(plainToInstance(ProfileSerializer, data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Read, Resource.IdentityProfiles)
  @ApiParam({ type: String, name: 'id', required: true })
  findOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .findOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Delete, Resource.IdentityProfiles)
  @ApiParam({ type: String, name: 'id', required: true })
  deleteOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .deleteOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Restore, Resource.IdentityProfiles)
  @ApiParam({ type: String, name: 'id', required: true })
  restoreOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .restoreOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Destroy, Resource.IdentityProfiles)
  @ApiParam({ type: String, name: 'id', required: true })
  destroyOne(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .destroyOne(toRaw(filter), toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Patch(':id')
  @SetScope(Scope.WriteIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.IdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  updateOne(
    @Meta() meta: Metadata,
    @Body() data: UpdateProfileDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Observable<ProfileSerializer> {
    assignIdToFilterQuery(filter, id);
    return this.provider.service
      .updateOne({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(ProfileSerializer));
  }

  @Patch('bulk')
  @UseInterceptors(FieldInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(Action.Update, Resource.IdentityProfiles)
  updateBulk(
    @Meta() meta: Metadata,
    @Body() data: UpdateProfileDto,
    @Filter() filter: QueryFilterDto,
  ): Observable<TotalSerializer> {
    return this.provider.service
      .updateBulk({ data, filter: toRaw(filter) }, toGrpcMeta(meta))
      .pipe(mapToInstance(TotalSerializer, 'total'));
  }
}
