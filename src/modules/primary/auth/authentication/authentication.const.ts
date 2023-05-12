import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  AUTH: { AUTHENTICATION },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Authentication Service
    name: AUTHENTICATION.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: AUTHENTICATION.PACKAGE.NAME,
      url: `0.0.0.0:${AUTHENTICATION.GRPC_PORT}`,
      protoPath: join(
        __dirname,
        'modules/primary/auth/authentication/authentication.proto',
      ),
    },
  },
];
