import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { Provider } from '@app/common/core/provider.core';
import { Artifact } from '@app/common/interfaces';

const {
  GENERAL: { ARTIFACTS },
} = APP;

@Injectable()
export class ArtifactsProvider
  extends Provider<Artifact>
  implements OnModuleInit
{
  constructor(@Inject(ARTIFACTS.SERVICE.SYMBOL) readonly client: ClientKafka) {
    super(
      {
        count: 'artifacts.count',
        create: 'artifacts.create',
        cursor: 'artifacts.cursor',
        findOne: 'artifacts.findOne',
        findMany: 'artifacts.findMany',
        findById: 'artifacts.findById',
        deleteById: 'artifacts.deleteById',
        restoreById: 'artifacts.restoreById',
        destroyById: 'artifacts.destroyById',
        updateById: 'artifacts.updateById',
        updateBulk: 'artifacts.updateBulk',
      },
      client,
    );
  }

  async onModuleInit() {
    this.client.subscribeToResponseOf('artifacts.count');
    this.client.subscribeToResponseOf('artifacts.create');
    this.client.subscribeToResponseOf('artifacts.cursor');
    this.client.subscribeToResponseOf('artifacts.findOne');
    this.client.subscribeToResponseOf('artifacts.findMany');
    this.client.subscribeToResponseOf('artifacts.findById');
    this.client.subscribeToResponseOf('artifacts.deleteById');
    this.client.subscribeToResponseOf('artifacts.restoreById');
    this.client.subscribeToResponseOf('artifacts.destroyById');
    this.client.subscribeToResponseOf('artifacts.updateById');
    this.client.subscribeToResponseOf('artifacts.updateBulk');

    await this.client.connect();
  }
}
