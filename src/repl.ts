/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

import { repl } from '@nestjs/core';

import { GatewayModule } from './gateway.module';

async function bootstrap() {
  await repl(GatewayModule);
}
bootstrap();
