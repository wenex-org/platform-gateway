import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  AUTH: { AUTHORIZATION },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Authorization Service
    name: AUTHORIZATION.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: AUTHORIZATION.PACKAGE.NAME,
      url: `0.0.0.0:${AUTHORIZATION.GRPC_PORT}`,
      protoPath: join(
        __dirname,
        'modules/primary/auth/authorization/authorization.proto',
      ),
    },
  },
];
