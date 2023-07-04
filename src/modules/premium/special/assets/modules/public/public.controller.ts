import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  AuthorityInterceptor,
  RateLimitInterceptor,
  SetMetadataInterceptor,
} from '@app/common/interceptors';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, PolicyGuard, ScopeGuard } from '@app/common/guards';
import { ParseMongoIdPipe, ValidationPipe } from '@app/common/pipes';
import { SetPolicy, SetScope } from '@app/common/metadatas';
import { Action, Resource, Scope } from '@app/common/enums';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { AssetsSerializer } from '@app/common/serializers';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';
import { AllExceptionsFilter } from '@app/common/filters';
import { mapToInstance } from '@app/common/utils';
import { CreateAssetDto } from '@app/common/dto';
import { Observable, map } from 'rxjs';
import { Response } from 'express';

import { PublicService } from './public.service';

@ApiBearerAuth()
@ApiTags('assets')
@Controller('assets')
@UsePipes(ValidationPipe)
@UseFilters(AllExceptionsFilter)
@UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
@UseInterceptors(
  SetMetadataInterceptor,
  AuthorityInterceptor,
  RateLimitInterceptor,
  new SentryInterceptor({ version: true }),
)
export class PublicController {
  constructor(public readonly service: PublicService) {}

  @Post('public/upload')
  @ApiConsumes('multipart/form-data')
  @SetScope(Scope.UploadPublicAssets)
  @SetPolicy(Action.Upload, Resource.SpecialAssets)
  upload(
    @UploadedFiles() files: CreateAssetDto[],
  ): Observable<AssetsSerializer> {
    return this.service
      .upload(files)
      .pipe(mapToInstance(AssetsSerializer, 'array'));
  }

  @Get('public/download/:id')
  @SetScope(Scope.DownloadPublicAssets)
  @UseGuards(AuthGuard, ScopeGuard, PolicyGuard)
  @SetPolicy(Action.Download, Resource.SpecialAssets)
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'multipart/form-data',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async downloadById(
    @Res() res: Response,
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    const { data, asset } = await this.service.downloadById(id);

    res.set({
      'Content-Type': asset.mimetype,
      'Content-Disposition': `attachment; filename="${asset.originalname}"`,
    });

    return sdkStreamMixin(data.pipe(map((res) => res.Body))).pipe(res);
  }
}
