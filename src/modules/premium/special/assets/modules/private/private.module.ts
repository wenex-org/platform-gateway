import { MINIO_CONFIG, MONGO_CONFIG, REDIS_CONFIG } from '@app/common/configs';
import { Asset, AssetSchema } from '@app/common/schemas';
import { MulterModule } from '@nestjs/platform-express';
import { PRIVATE_BUCKET } from '@app/common/consts';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import * as multerS3 from 'multer-s3';

import { PrivateService } from './private.service';
import { PrivateRepository } from './private.repository';
import { PrivateController } from './private.controller';

const { PRIVATE_STORAGE } = MINIO_CONFIG();

@Module({
  imports: [
    RedisModule.register(REDIS_CONFIG()),
    MongooseModule.forRoot(MONGO_CONFIG()),
    MulterModule.register({ storage: multerS3(PRIVATE_STORAGE) }),
    MongooseModule.forFeature([{ name: Asset.name, schema: AssetSchema }]),
  ],
  controllers: [PrivateController],
  providers: [
    {
      provide: PRIVATE_BUCKET,
      useValue: PRIVATE_STORAGE.s3,
    },
    PrivateService,
    PrivateRepository,
  ],
  exports: [PrivateService],
})
export class PrivateModule {}
