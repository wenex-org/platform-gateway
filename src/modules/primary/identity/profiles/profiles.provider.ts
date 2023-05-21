import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ProfilesService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  IDENTITY: { PROFILES },
} = APP;

@Injectable()
export class ProfilesProvider implements OnModuleInit {
  public service: ProfilesService;

  constructor(@Inject(PROFILES.PACKAGE.SYMBOL) protected client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<ProfilesService>(
      PROFILES.SERVICE.NAME,
    );
  }
}
