import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ArtifactsService } from '@app/common/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { APP } from '@app/common/consts';

const {
  AUTH: { GRANTS },
} = APP;

@Injectable()
export class ArtifactsProvider implements OnModuleInit {
  public service: ArtifactsService;

  constructor(@Inject(GRANTS.PACKAGE.SYMBOL) protected client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<ArtifactsService>(
      GRANTS.SERVICE.NAME,
    );
  }
}
