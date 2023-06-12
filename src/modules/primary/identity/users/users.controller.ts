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

import { UsersProvider } from './users.provider';

@ApiBearerAuth()
@ApiTags('identity')
@Controller('users')
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
export class UsersController {
  constructor(private readonly provider: UsersProvider) {}

  @Get('count')
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
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
  @SetScope(Scope.WriteIdentityUsers)
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @SetPolicy(SysAction.Create, Resource.IdentityUsers)
  async create(
    @Meta() meta: Metadata,
    @Body() data: CreateUserDto,
  ): Promise<UserSerializer> {
    return UserSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Get()
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: FilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
  async findMany(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
  ): Promise<UsersSerializer> {
    return UsersSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(filter), meta)))
        .items,
    );
  }

  @Sse('sse')
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
  @ApiResponse({ type: UserSerializer, status: HttpStatus.OK })
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
            data: plainToInstance(UserSerializer, perm.filter(data)),
          } as unknown as MessageEvent),
      ),
    );
  }

  @Get(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ReadIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @SetPolicy(SysAction.Read, Resource.IdentityUsers)
  @ApiParam({ type: String, name: 'id', required: true })
  async findById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(filter), meta)),
    );
  }

  @Delete(':id')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Delete, Resource.IdentityUsers)
  async deleteById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(
        this.provider.service.deleteById(toRaw(filter), meta),
      ),
    );
  }

  @Put(':id/restore')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Restore, Resource.IdentityUsers)
  async restoreById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(
        this.provider.service.restoreById(toRaw(filter), meta),
      ),
    );
  }

  @Delete(':id/destroy')
  @UseInterceptors(FilterInterceptor)
  @SetScope(Scope.ManageIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Destroy, Resource.IdentityUsers)
  async destroyById(
    @Meta() meta: Metadata,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
      await lastValueFrom(
        this.provider.service.destroyById(toRaw(filter), meta),
      ),
    );
  }

  @Patch(':id')
  @UseInterceptors(UpdateInterceptor)
  @SetScope(Scope.WriteIdentityUsers)
  @ApiQuery({ type: OneFilterDto, required: false })
  @UseInterceptors(FieldInterceptor, FilterInterceptor)
  @ApiParam({ type: String, name: 'id', required: true })
  @SetPolicy(SysAction.Update, Resource.IdentityUsers)
  async updateById(
    @Meta() meta: Metadata,
    @Body() update: UpdateUserDto,
    @Filter() filter: OneFilterDto,
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: id });
    return UserSerializer.build(
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
  @SetScope(Scope.ManageIdentityUsers)
  @ApiQuery({ type: QueryFilterDto, required: false })
  @SetPolicy(SysAction.Update, Resource.IdentityUsers)
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() update: UpdateUserDto,
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
