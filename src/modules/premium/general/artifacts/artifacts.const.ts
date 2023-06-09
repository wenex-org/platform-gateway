import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from '@app/common/configs';
import { deserializer } from '@app/common/utils';
import { APP } from '@app/common/consts';

const {
  GENERAL: { ARTIFACTS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Artifact Service
    name: ARTIFACTS.SERVICE.SYMBOL,
    transport: Transport.KAFKA,
    options: {
      deserializer: deserializer,
      subscribe: { fromBeginning: true },
      consumer: { groupId: ARTIFACTS.CONSUMER.GROUP_ID },
      client: { clientId: ARTIFACTS.CLIENT.ID, brokers: [KAFKA_CONFIG()] },
    },
  },
];
