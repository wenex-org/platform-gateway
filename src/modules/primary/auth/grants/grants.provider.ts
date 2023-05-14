import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { GrantsService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  AUTH: { GRANTS },
} = APP;

@Injectable()
export class GrantsProvider implements OnModuleInit {
  public service: GrantsService;

  constructor(@Inject(GRANTS.PACKAGE.SYMBOL) protected client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<GrantsService>(GRANTS.SERVICE.NAME);
  }
}
