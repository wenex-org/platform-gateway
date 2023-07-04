import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AssetInterface } from '@app/common/interfaces';
import { PRIVATE_BUCKET } from '@app/common/consts';
import { AssetDocument } from '@app/common/schemas';
import { CreateAssetDto } from '@app/common/dto';
import { Observable, from } from 'rxjs';

import { PrivateRepository } from './private.repository';

@Injectable()
export class PrivateService {
  constructor(
    readonly repository: PrivateRepository,
    @Inject(PRIVATE_BUCKET) private readonly s3: S3Client,
  ) {}

  upload(assets: CreateAssetDto[]): Observable<AssetDocument[]> {
    const promises = assets.map((asset) => this.repository.create(asset));
    return from(Promise.all(promises));
  }

  getObject(asset: AssetInterface): Observable<GetObjectCommandOutput> {
    const input = { Bucket: asset.bucket, Key: asset.key };
    const command = new GetObjectCommand(input);

    return from(this.s3.send(command));
  }

  deleteObject(
    bucket: string,
    key: string,
  ): Observable<DeleteObjectCommandOutput> {
    const params = { Bucket: bucket, Key: key };
    const command = new DeleteObjectCommand(params);

    return from(this.s3.send(command));
  }

  async downloadById(id: string) {
    const asset = await this.repository.findById({ query: { id } });

    if (!asset) throw new NotFoundException('File not found');

    return { data: this.getObject(asset), asset };
  }
}
