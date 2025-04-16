import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as crypto from 'crypto';

/**
 * 文件上传服务
 */
@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  /**
   * 上传文件
   * @param file 文件对象
   * @param type 文件类型（image, file, avatar）
   * @returns 上传结果
   */
  async uploadFile(
    file: Express.Multer.File,
    type = 'image',
  ): Promise<{ url: string; path: string }> {
    const strategy = this.configService.get('upload.strategy', 'local');

    // 根据策略选择不同的上传方法
    switch (strategy) {
      case 'local':
        return this.uploadToLocal(file, type);
      case 'oss':
        return this.uploadToOSS(file, type);
      case 'cos':
        return this.uploadToCOS(file, type);
      case 'qiniu':
        return this.uploadToQiniu(file, type);
      default:
        return this.uploadToLocal(file, type);
    }
  }

  /**
   * 本地上传
   * @param file 文件对象
   * @param type 文件类型
   * @returns 上传结果
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    type: string,
  ): Promise<{ url: string; path: string }> {
    const localUrl = this.configService.get('upload.local.url');
    const localPath = this.configService.get('upload.local.path');

    // 根据文件类型和日期创建存储路径
    const datePath = dayjs().format('YYYY/MM/DD');
    const dirPath = path.join(localPath, type, datePath);

    // 确保目录存在
    await this.ensureDir(dirPath);

    // 生成文件名
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const fileName = `${timestamp}-${randomStr}${path.extname(file.originalname)}`;

    // 文件保存路径
    const filePath = path.join(dirPath, fileName);

    // 创建可写流，写入文件
    const writeStream = fs.createWriteStream(filePath);
    writeStream.write(file.buffer);
    writeStream.end();

    // 返回文件访问路径
    const fileUrl = `${localUrl}${type}/${datePath}/${fileName}`;
    return {
      url: fileUrl,
      path: filePath,
    };
  }

  /**
   * 上传至阿里云OSS
   * @param file 文件对象
   * @param type 文件类型
   * @returns 上传结果
   */
  private async uploadToOSS(
    file: Express.Multer.File,
    type: string,
  ): Promise<{ url: string; path: string }> {
    // TODO: 集成阿里云OSS SDK
    // 实现上传逻辑
    throw new Error('阿里云OSS上传暂未实现');
  }

  /**
   * 上传至腾讯云COS
   * @param file 文件对象
   * @param type 文件类型
   * @returns 上传结果
   */
  private async uploadToCOS(
    file: Express.Multer.File,
    type: string,
  ): Promise<{ url: string; path: string }> {
    // TODO: 集成腾讯云COS SDK
    // 实现上传逻辑
    throw new Error('腾讯云COS上传暂未实现');
  }

  /**
   * 上传至七牛云
   * @param file 文件对象
   * @param type 文件类型
   * @returns 上传结果
   */
  private async uploadToQiniu(
    file: Express.Multer.File,
    type: string,
  ): Promise<{ url: string; path: string }> {
    // TODO: 集成七牛云SDK
    // 实现上传逻辑
    throw new Error('七牛云上传暂未实现');
  }

  /**
   * 确保目录存在
   * @param dir 目录路径
   */
  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.promises.access(dir);
    } catch (error) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }
}
