import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const { CONFIGS } = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Configs Service
    name: CONFIGS.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: CONFIGS.PACKAGE.NAME,
      url: `0.0.0.0:${CONFIGS.GRPC_PORT}`,
      protoPath: join(__dirname, 'modules/primary/configs/configs.proto'),
    },
  },
];
