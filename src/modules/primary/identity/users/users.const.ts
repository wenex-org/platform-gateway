import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  IDENTITY: { USERS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Users Service
    name: USERS.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: USERS.PACKAGE.NAME,
      url: `0.0.0.0:${USERS.GRPC_PORT}`,
      protoPath: join(__dirname, 'modules/primary/identity/users/users.proto'),
    },
  },
];
