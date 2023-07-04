import { AssetInterface } from '@app/common/interfaces';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from '@app/common/core';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Asset, AssetDocument } from '@app/common/schemas';

@Injectable()
export class PublicRepository extends Repository<AssetInterface> {
  constructor(@InjectModel(Asset.name) readonly model: Model<AssetDocument>) {
    super(model);
  }
}
