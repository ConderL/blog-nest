import { Controller, Post, UseInterceptors, UploadedFile, Body, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UploadService } from '../../services/upload/upload.service';

@ApiTags('文件上传')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传图片
   * @param file 图片文件
   */
  @Post('image')
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片文件',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        code: 400,
        message: '请选择要上传的图片',
        data: null,
      };
    }

    // 检查文件格式
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        code: 400,
        message: '只允许上传jpg, png, gif, webp格式的图片',
        data: null,
      };
    }

    try {
      const result = await this.uploadService.uploadFile(file, 'image');
      return {
        code: 200,
        message: '上传成功',
        data: {
          url: result.url,
          name: file.originalname,
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: '上传失败: ' + error.message,
        data: null,
      };
    }
  }

  /**
   * 上传文件
   * @param file 文件
   */
  @Post('file')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '文件',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        code: 400,
        message: '请选择要上传的文件',
        data: null,
      };
    }

    try {
      const result = await this.uploadService.uploadFile(file, 'file');
      return {
        code: 200,
        message: '上传成功',
        data: {
          url: result.url,
          name: file.originalname,
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: '上传失败: ' + error.message,
        data: null,
      };
    }
  }

  /**
   * 上传头像
   * @param file 头像文件
   */
  @Post('avatar')
  @ApiOperation({ summary: '上传头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '头像文件',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return {
        code: 400,
        message: '请选择要上传的头像',
        data: null,
      };
    }

    // 检查文件格式
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        code: 400,
        message: '只允许上传jpg, png, gif, webp格式的图片',
        data: null,
      };
    }

    try {
      const result = await this.uploadService.uploadFile(file, 'avatar');
      return {
        code: 200,
        message: '上传成功',
        data: {
          url: result.url,
          name: file.originalname,
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: '上传失败: ' + error.message,
        data: null,
      };
    }
  }
}
