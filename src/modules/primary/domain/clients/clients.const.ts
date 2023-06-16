import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  DOMAIN: { CLIENTS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Clients Service
    name: CLIENTS.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: CLIENTS.PACKAGE.NAME,
      url: `0.0.0.0:${CLIENTS.GRPC_PORT}`,
      protoPath: join(
        __dirname,
        'modules/primary/domain/clients/clients.proto',
      ),
    },
  },
];
