import { ClientsModuleOptions, Transport } from '@nestjs/microservices';
import { APP } from '@app/common/consts';
import { join } from 'path';

const {
  GENERAL: { LOCATIONS },
} = APP;

export const clientsModuleOptions: ClientsModuleOptions = [
  {
    // Locations Service
    name: LOCATIONS.PACKAGE.SYMBOL,
    transport: Transport.GRPC,
    options: {
      loader: { keepCase: true },
      package: LOCATIONS.PACKAGE.NAME,
      url: `0.0.0.0:${LOCATIONS.GRPC_PORT}`,
      protoPath: join(
        __dirname,
        'modules/premium/general/locations/locations.proto',
      ),
    },
  },
];
