import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AuthorizationService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  AUTH: { AUTHORIZATION },
} = APP;

@Injectable()
export class AuthorizationProvider implements OnModuleInit {
  public service: AuthorizationService;

  constructor(
    @Inject(AUTHORIZATION.PACKAGE.SYMBOL) protected client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.service = this.client.getService<AuthorizationService>(
      AUTHORIZATION.SERVICE.NAME,
    );
  }
}
