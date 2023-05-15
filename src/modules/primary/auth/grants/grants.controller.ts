import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  CountSerializer,
  GrantSerializer,
  GrantsSerializer,
} from '@app/common/serializers';
import {
  CountFilterDto,
  CreateGrantDto,
  FilterDto,
  OneFilterDto,
  UpdateGrantBulkDto,
  UpdateGrantOneDto,
} from '@app/common/dto';
import {
  AuthorityInterceptor,
  MetadataTakeInterceptor,
  RateLimitInterceptor,
} from '@app/common/interceptors';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Resource, Scope, SysAction } from '@app/common/enums';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AllExceptionsFilter } from '@app/common/filters';
import { Filter, Meta } from '@app/common/decorators';
import { ValidationPipe } from '@app/common/pipes';
import { toRaw } from '@app/common/utils';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { GrantsProvider } from './grants.provider';

@ApiBearerAuth()
@ApiTags('grants')
@Controller('grants')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  RateLimitInterceptor,
  AuthorityInterceptor,
  MetadataTakeInterceptor,
  ClassSerializerInterceptor,
  new SentryInterceptor({ version: true }),
)
export class GrantsController {
  constructor(private readonly provider: GrantsProvider) {}

  @Get('count')
  @SetScope(Scope.ReadGrants)
  @SetPolicy(SysAction.Read, Resource.Grants)
  @ApiQuery({ type: CountFilterDto, required: false })
  async count(
    @Meta() meta: Metadata,
    @Filter() data: CountFilterDto,
  ): Promise<CountSerializer> {
    return CountSerializer.build(
      (await lastValueFrom(this.provider.service.count(toRaw(data), meta)))
        .count,
    );
  }

  @Post()
  @SetScope(Scope.WriteGrants)
  @SetPolicy(SysAction.Create, Resource.Grants)
  async create(
    @Meta() meta: Metadata,
    @Body() data: CreateGrantDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.create(data, meta)),
    );
  }

  @Get()
  @SetScope(Scope.ReadGrants)
  @SetPolicy(SysAction.Read, Resource.Grants)
  async findMany(
    @Meta() meta: Metadata,
    @Body() data: FilterDto,
  ): Promise<GrantsSerializer> {
    return GrantsSerializer.build(
      (await lastValueFrom(this.provider.service.findMany(toRaw(data), meta)))
        .items,
    );
  }

  @Get(':id')
  @SetScope(Scope.ReadGrants)
  @SetPolicy(SysAction.Read, Resource.Grants)
  async findById(
    @Meta() meta: Metadata,
    @Body() data: OneFilterDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.findById(toRaw(data), meta)),
    );
  }

  @Delete(':id')
  @SetScope(Scope.WriteGrants)
  @SetPolicy(SysAction.Delete, Resource.Grants)
  async deleteById(
    @Meta() meta: Metadata,
    @Body() data: OneFilterDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.deleteById(toRaw(data), meta)),
    );
  }

  @Put(':id')
  @SetScope(Scope.WriteGrants)
  @SetPolicy(SysAction.Restore, Resource.Grants)
  async restoreById(
    @Meta() meta: Metadata,
    @Body() data: OneFilterDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.restoreById(toRaw(data), meta)),
    );
  }

  @Put(':id')
  @SetScope(Scope.ManageGrants)
  @SetPolicy(SysAction.Destroy, Resource.Grants)
  async destroyById(
    @Meta() meta: Metadata,
    @Body() data: OneFilterDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(this.provider.service.destroyById(toRaw(data), meta)),
    );
  }

  @Patch(':id')
  @SetScope(Scope.WriteGrants)
  @SetPolicy(SysAction.Update, Resource.Grants)
  async updateById(
    @Meta() meta: Metadata,
    @Body() { filter, update }: UpdateGrantOneDto,
  ): Promise<GrantSerializer> {
    return GrantSerializer.build(
      await lastValueFrom(
        this.provider.service.updateById(
          { update, filter: toRaw(filter) },
          meta,
        ),
      ),
    );
  }

  @Patch('bulk')
  @SetScope(Scope.ManageGrants)
  @SetPolicy(SysAction.Update, Resource.Grants)
  async updateBulk(
    @Meta() meta: Metadata,
    @Body() { filter, update }: UpdateGrantBulkDto,
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
