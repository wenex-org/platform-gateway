import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { KAFKA_CONFIG } from '@app/common/configs';
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
      client: { brokers: [KAFKA_CONFIG()] },
      consumer: { groupId: ARTIFACTS.CONSUMER.GROUP_ID },
    },
  },
];
