import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from '@app/common/configs';
import { deserializer } from '@app/common/utils';
import { APP } from '@app/common/consts';

const {
  SPECIAL: { ASSETS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Asset Service
    name: ASSETS.SERVICE.SYMBOL,
    transport: Transport.KAFKA,
    options: {
      deserializer: deserializer,
      subscribe: { fromBeginning: true },
      consumer: { groupId: ASSETS.CONSUMER.GROUP_ID },
      client: { clientId: ASSETS.CLIENT.ID, brokers: [KAFKA_CONFIG()] },
    },
  },
];
