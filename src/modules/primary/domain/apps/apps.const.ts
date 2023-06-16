import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  DOMAIN: { APPS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Apps Service
    name: APPS.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: APPS.PACKAGE.NAME,
      url: `0.0.0.0:${APPS.GRPC_PORT}`,
      protoPath: join(__dirname, 'modules/primary/domain/apps/apps.proto'),
    },
  },
];
