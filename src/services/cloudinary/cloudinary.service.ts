import {
  v2 as cld,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { CLOUDINARY_CONSTANTS } from './constant';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const config = {
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    };
    cld.config(config);
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cld.uploader.upload_stream(
        {
          folder: CLOUDINARY_CONSTANTS.UPLOAD_FOLDER,
          resource_type: CLOUDINARY_CONSTANTS.RESOURCE_TYPE,
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            const errorMessage =
              typeof error === 'object' && error && 'message' in error
                ? String(error.message)
                : 'Upload failed';
            reject(new Error(errorMessage));
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload failed: no result returned'));
          }
        },
      );

      upload.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    const result = await cld.uploader.destroy(publicId);
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
  }
}
