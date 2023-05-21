import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  IDENTITY: { PROFILES },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Profile Service
    name: PROFILES.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: PROFILES.PACKAGE.NAME,
      url: `0.0.0.0:${PROFILES.GRPC_PORT}`,
      protoPath: join(
        __dirname,
        'modules/primary/identity/profiles/profiles.proto',
      ),
    },
  },
];
