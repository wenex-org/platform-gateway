import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AuthenticationService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  AUTH: { AUTHENTICATION },
} = APP;

@Injectable()
export class AuthenticationProvider implements OnModuleInit {
  public service: AuthenticationService;

  constructor(
    @Inject(AUTHENTICATION.PACKAGE.SYMBOL) protected client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.service = this.client.getService<AuthenticationService>(
      AUTHENTICATION.SERVICE.NAME,
    );
  }
}
