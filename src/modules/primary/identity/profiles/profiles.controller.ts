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

import { ProfilesProvider } from './profiles.provider';

@ApiBearerAuth()
@ApiTags('identity')
@Controller('profiles')
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
export class ProfilesController {
  constructor(private readonly provider: ProfilesProvider) {}

  @Get('count')
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
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
  @SetScope(Scope.WriteIdentityProfiles)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Create, Resource.IdentityProfiles)
  async create(
    @Meta() meta: Metadata,
    @Body() data: CreateProfileDto,
  ): Promise<ProfileSerializer> {
    return ProfileSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
  async findMany(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Promise<ProfilesSerializer> {
    return ProfilesSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
  @ApiResponse({ type: ProfileSerializer, status: HttpStatus.OK })
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
            data: plainToInstance(ProfileSerializer, perm.filter(data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityProfiles)
  @ApiParam({ type: String, name: 'id', required: true })
  async findById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Delete, Resource.IdentityProfiles)
  async deleteById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Restore, Resource.IdentityProfiles)
  async restoreById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Destroy, Resource.IdentityProfiles)
  async destroyById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Patch(':id')
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentityProfiles)
  @ApiQuery({ type: OneFilterDto, required: false })
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Update, Resource.IdentityProfiles)
  async updateById(
    @Meta() meta: Metadata,
    @Body() update: UpdateProfileDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<ProfileSerializer> {
    Object.assign(filter.query, { _id: id });
    return ProfileSerializer.build(
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
  @SetScope(Scope.ManageIdentityProfiles)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(SysAction.Update, Resource.IdentityProfiles)
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() update: UpdateProfileDto,
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
