import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SessionsService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  IDENTITY: { SESSIONS },
} = APP;

@Injectable()
export class SessionsProvider implements OnModuleInit {
  public service: SessionsService;

  constructor(@Inject(SESSIONS.PACKAGE.SYMBOL) protected client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<SessionsService>(
      SESSIONS.SERVICE.NAME,
    );
  }
}
