import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const { ARCHIVES } = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Archive Service
    name: ARCHIVES.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: ARCHIVES.PACKAGE.NAME,
      url: `0.0.0.0:${ARCHIVES.GRPC_PORT}`,
      protoPath: join(__dirname, 'modules/premium/archives/archives.proto'),
    },
  },
];
