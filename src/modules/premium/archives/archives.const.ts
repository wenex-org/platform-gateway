import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from '@app/common/configs';
import { deserializer } from '@app/common/utils';
import { APP } from '@app/common/consts';

const { ARCHIVES } = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Archive Service
    name: ARCHIVES.SERVICE.SYMBOL,
    transport: Transport.KAFKA,
    options: {
      deserializer: deserializer,
      subscribe: { fromBeginning: true },
      consumer: { groupId: ARCHIVES.CONSUMER.GROUP_ID },
      client: { clientId: ARCHIVES.CLIENT.ID, brokers: [KAFKA_CONFIG()] },
    },
  },
];
