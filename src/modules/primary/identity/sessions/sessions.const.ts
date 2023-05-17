import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  IDENTITY: { SESSIONS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Authorization Service
    name: SESSIONS.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: SESSIONS.PACKAGE.NAME,
      url: `0.0.0.0:${SESSIONS.GRPC_PORT}`,
      protoPath: join(
        __dirname,
        'modules/primary/identity/sessions/sessions.proto',
      ),
    },
  },
];
