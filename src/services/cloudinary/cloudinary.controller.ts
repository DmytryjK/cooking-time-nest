import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const imageUrl = await this.cloudinaryService.uploadImage(file);

    return {
      success: true,
      message: 'Image uploaded successfully',
      url: imageUrl,
    };
  }

  @Post('test')
  test() {
    return {
      success: true,
      message: 'Cloudinary service is working',
    };
  }
}
