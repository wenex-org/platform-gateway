import { NamingConventionsInterceptor } from '@app/common/interceptors';
import { GatewayModule } from './gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { NODE_ENV } from '@app/common/configs';
import { NestFactory } from '@nestjs/core';
import { initTracing } from 'tracing';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  if (NODE_ENV().IS_PRODUCTION) await initTracing();

  const app = await NestFactory.create(GatewayModule, { cors: true });

  app.useGlobalInterceptors(new NamingConventionsInterceptor());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(3000);
}
bootstrap();
