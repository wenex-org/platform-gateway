import {
  SessionSerializer,
  UserSerializer,
  UsersSerializer,
} from '@app/common/serializers';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Resource, Scope, SysAction } from '@app/common/enums';
import { AuthorizationProvider } from '@app/common/providers';
import { FilterDto, OneFilterDto } from '@app/common/dto';
import { AllExceptionsFilter } from '@app/common/filters';
import { UseFilters, UsePipes } from '@nestjs/common';
import { Filter, Meta } from '@app/common/decorators';
import { plainToInstance } from 'class-transformer';
import { FieldResolver } from '@app/common/classes';
import { ValidationPipe } from '@app/common/pipes';
import { Session } from '@app/common/interfaces';
import { toRaw } from '@app/common/utils';
import { lastValueFrom, map } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

import { UsersProvider } from '../../users/users.provider';

@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@Resolver(() => SessionSerializer)
export class UsersFieldResolver extends FieldResolver {
  constructor(
    authorization: AuthorizationProvider,
    private readonly provider: UsersProvider,
  ) {
    super(authorization, Scope.ReadIdentityUsers, {
      action: SysAction.Read,
      object: Resource.IdentityUsers,
    });
  }

  @ResolveField(() => UserSerializer)
  async session_owner(
    @Meta() meta: Metadata,
    @Parent() { owner }: Session,
    @Filter() filter: OneFilterDto,
  ): Promise<UserSerializer> {
    const perm = await this.makePermission(meta);
    Object.assign(filter.query, { _id: owner });

    return await lastValueFrom(
      this.provider.service
        .findById(toRaw(filter), meta)
        .pipe(map((res) => plainToInstance(UserSerializer, perm.filter(res)))),
    );
  }

  @ResolveField(() => UsersSerializer)
  async session_shares(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
    @Parent() { shares }: Session,
  ): Promise<UsersSerializer> {
    const perm = await this.makePermission(meta);
    Object.assign(filter.query, { _id: { $in: shares } });

    return await lastValueFrom(
      this.provider.service
        .findMany(toRaw(filter), meta)
        .pipe(
          map((res) =>
            plainToInstance(UsersSerializer, { items: perm.filter(res.items) }),
          ),
        ),
    );
  }
}
