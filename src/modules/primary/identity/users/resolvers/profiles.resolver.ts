import {
  ProfileSerializer,
  ProfilesSerializer,
  UserSerializer,
} from '@app/common/serializers';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Resource, Scope, SysAction } from '@app/common/enums';
import { AuthorizationProvider } from '@app/common/providers';
import { FilterDto, OneFilterDto } from '@app/common/dto';
import { AllExceptionsFilter } from '@app/common/filters';
import { Filter, Meta } from '@app/common/decorators';
import { plainToInstance } from 'class-transformer';
import { FieldResolver } from '@app/common/classes';
import { Profile } from '@app/common/interfaces';
import { UseFilters } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { toRaw } from '@app/common/utils';
import { Metadata } from '@grpc/grpc-js';

import { ProfilesProvider } from '../../profiles/profiles.provider';

@UseFilters(AllExceptionsFilter)
@Resolver(() => UserSerializer)
export class ProfilesFieldResolver extends FieldResolver {
  constructor(
    authorization: AuthorizationProvider,
    private readonly provider: ProfilesProvider,
  ) {
    super(authorization, Scope.ReadIdentityProfiles, {
      action: SysAction.Read,
      object: Resource.IdentityProfiles,
    });
  }

  @ResolveField(() => ProfileSerializer)
  async user_owner(
    @Meta() meta: Metadata,
    @Parent() { owner }: Profile,
    @Filter() filter: OneFilterDto,
  ): Promise<ProfileSerializer> {
    const perm = await this.makePermission(meta);
    Object.assign(filter.query, { _id: owner });

    return await lastValueFrom(
      this.provider.service
        .findById(toRaw(filter), meta)
        .pipe(
          map((res) => plainToInstance(ProfileSerializer, perm.filter(res))),
        ),
    );
  }

  @ResolveField(() => ProfilesSerializer)
  async user_shares(
    @Meta() meta: Metadata,
    @Filter() filter: FilterDto,
    @Parent() { shares }: Profile,
  ): Promise<ProfilesSerializer> {
    const perm = await this.makePermission(meta);
    Object.assign(filter.query, { _id: { $in: shares } });

    return await lastValueFrom(
      this.provider.service.find(toRaw(filter), meta).pipe(
        map((res) =>
          plainToInstance(ProfilesSerializer, {
            items: perm.filter(res.items),
          }),
        ),
      ),
    );
  }
}
