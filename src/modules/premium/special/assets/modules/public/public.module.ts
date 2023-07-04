import { MINIO_CONFIG, MONGO_CONFIG, REDIS_CONFIG } from '@app/common/configs';
import { Asset, AssetSchema } from '@app/common/schemas';
import { MulterModule } from '@nestjs/platform-express';
import { PUBLIC_BUCKET } from '@app/common/consts';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import * as multerS3 from 'multer-s3';

import { PublicService } from './public.service';
import { PublicRepository } from './public.repository';
import { PublicController } from './public.controller';

const { PUBLIC_STORAGE } = MINIO_CONFIG();

@Module({
  imports: [
    RedisModule.register(REDIS_CONFIG()),
    MongooseModule.forRoot(MONGO_CONFIG()),
    MulterModule.register({ storage: multerS3(PUBLIC_STORAGE) }),
    MongooseModule.forFeature([{ name: Asset.name, schema: AssetSchema }]),
  ],
  controllers: [PublicController],
  providers: [
    {
      provide: PUBLIC_BUCKET,
      useValue: PUBLIC_STORAGE.s3,
    },
    PublicService,
    PublicRepository,
  ],
  exports: [PublicService],
})
export class PublicModule {}
