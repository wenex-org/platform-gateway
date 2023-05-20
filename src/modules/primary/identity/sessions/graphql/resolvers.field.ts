import {
  SessionSerializer,
  UserSerializer,
  UsersSerializer,
} from '@app/common/serializers';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Filter, Meta } from '@app/common/decorators';
import { Session } from '@app/common/interfaces';
import { OneFilterDto } from '@app/common/dto';
import { toRaw } from '@app/common/utils';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { UsersProvider } from '../../users/users.provider';

export interface ResolvesFieldOptions {
  users: UsersProvider;
}

@Resolver(() => SessionSerializer)
export class ResolvesField {
  constructor(private readonly providers: ResolvesFieldOptions) {}

  @ResolveField(() => UserSerializer)
  async sessionOwner(
    @Meta() meta: Metadata,
    @Parent() { owner }: Session,
    @Filter() filter: OneFilterDto,
  ): Promise<UserSerializer> {
    Object.assign(filter.query, { _id: owner });
    return UserSerializer.build(
      await lastValueFrom(
        this.providers.users.service.findById(toRaw(filter), meta),
      ),
    );
  }

  @ResolveField(() => UsersSerializer)
  async sessionShares(
    @Meta() meta: Metadata,
    @Parent() { shares }: Session,
    @Filter() filter: OneFilterDto,
  ): Promise<UsersSerializer> {
    Object.assign(filter.query, { _id: { $in: shares } });
    return UsersSerializer.build(
      (
        await lastValueFrom(
          this.providers.users.service.findMany(toRaw(filter), meta),
        )
      ).items,
    );
  }
}
