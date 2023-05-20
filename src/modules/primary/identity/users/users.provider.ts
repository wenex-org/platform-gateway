import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  IDENTITY: { USERS },
} = APP;

@Injectable()
export class UsersProvider implements OnModuleInit {
  public service: UsersService;

  constructor(@Inject(USERS.PACKAGE.SYMBOL) protected client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<UsersService>(USERS.SERVICE.NAME);
  }
}
