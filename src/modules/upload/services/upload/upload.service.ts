import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as crypto from 'crypto';
import * as https from 'https';
import * as url from 'url';
// 注：这里引入ali-oss需要先安装依赖：npm install ali-oss @types/ali-oss --save
// 此处先注释，需要时取消注释
// import OSS from 'ali-oss';

/**
 * 文件上传服务
 */
@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  /**
   * 获取上传路径
   * @returns 上传根目录路径
   */
  getUploadPath(): string {
    return this.configService.get('upload.local.path', 'public/uploads/');
  }

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
    try {
      // 获取本地存储配置
      const localUrl = this.configService.get('upload.local.url');
      const localPath = this.configService.get('upload.local.path');

      // 验证文件是否存在
      if (!file || !file.buffer) {
        throw new Error('上传文件不存在或内容为空');
      }

      console.log('准备上传文件:', file.originalname, '大小:', file.size, '类型:', file.mimetype);

      // 根据文件类型和日期创建存储路径
      const datePath = dayjs().format('YYYY-MM-DD');
      const webPath = `${type}/${datePath}`;

      // 文件系统路径 - 使用当前系统的路径分隔符
      const dirPath = path.join(localPath, type);

      // 确保目录存在 - 先只创建主目录
      await this.ensureDir(dirPath);

      // 再创建日期子目录
      const fullDirPath = path.join(dirPath, datePath);
      await this.ensureDir(fullDirPath);

      // 生成文件名
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString('hex');
      const fileName = `${timestamp}-${randomStr}${path.extname(file.originalname)}`;

      // 文件保存路径
      const filePath = path.join(fullDirPath, fileName);
      console.log('保存文件路径:', filePath);

      // 使用fs.promises.writeFile代替流写入
      await fs.promises.writeFile(filePath, file.buffer);
      console.log('文件写入成功');

      // 构建一个基于控制器路由的URL
      const baseUrl = localUrl.endsWith('/') ? localUrl.slice(0, -1) : localUrl; // 移除尾部斜杠
      const fileUrl = `${baseUrl}/uploads/${type}/${datePath}/${fileName}`;
      // 修复路径中可能出现的双重uploads
      const finalUrl = fileUrl.replace('/uploads/uploads/', '/uploads/');
      console.log('文件URL:', finalUrl);

      return {
        url: finalUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('本地上传失败:', error);
      throw new Error(`本地上传失败: ${error.message}`);
    }
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
    try {
      // 直接从环境变量获取OSS配置
      const accessKeyId = this.configService.get('OSS_ACCESS_KEY_ID');
      const accessKeySecret = this.configService.get('OSS_ACCESS_KEY_SECRET');
      const region = this.configService.get('OSS_REGION');
      const bucket = this.configService.get('OSS_BUCKET');
      const endpoint = this.configService.get('OSS_ENDPOINT');

      // 尝试从upload.oss配置中获取（fallback）
      const ossConfig = this.configService.get('upload.oss');

      // 优先使用环境变量，如果没有则使用配置
      const finalAccessKeyId = accessKeyId || (ossConfig && ossConfig.accessKeyId);
      const finalAccessKeySecret = accessKeySecret || (ossConfig && ossConfig.accessKeySecret);
      const finalRegion = region || (ossConfig && ossConfig.region);
      const finalBucket = bucket || (ossConfig && ossConfig.bucketName);
      const finalEndpoint = endpoint || (ossConfig && ossConfig.endpoint);

      if (!finalAccessKeyId || !finalAccessKeySecret || !finalRegion || !finalBucket) {
        throw new Error('阿里云OSS配置不完整');
      }

      console.log('OSS配置信息检查：', {
        accessKeyId: !!finalAccessKeyId,
        accessKeySecret: !!finalAccessKeySecret,
        region: finalRegion,
        bucket: finalBucket,
        endpoint: finalEndpoint,
      });

      // 生成OSS路径
      const datePath = dayjs().format('YYYY/MM/DD');
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString('hex');
      const fileName = `${timestamp}-${randomStr}${path.extname(file.originalname)}`;
      const ossPath = `${type}/${datePath}/${fileName}`;

      // 使用环境变量中的endpoint构建OSS URL
      const url = `${finalEndpoint.replace('https://', `https://${finalBucket}.`)}/${ossPath}`;

      // 临时方案，暂不执行实际上传，仅返回URL结构
      console.warn('阿里云OSS SDK未启用，仅返回URL结构，未实际上传');
      console.log('生成的URL:', url);
      return {
        url,
        path: ossPath,
      };
    } catch (error) {
      console.error('上传至阿里云OSS失败', error);
      throw new Error(`上传至阿里云OSS失败: ${error.message}`);
    }
  }

  /**
   * 使用HTTPS模块上传到OSS
   * 注意：这是一个简化的实现，仅作为临时方案
   * 生产环境应使用官方SDK
   */
  private async uploadToOssWithHttps(
    buffer: Buffer,
    objectName: string,
    ossConfig: any,
  ): Promise<void> {
    const { accessKeyId, accessKeySecret, bucketName, endpoint } = ossConfig;

    // 构建请求URL
    const parsedUrl = url.parse(endpoint);
    const host = `${bucketName}.${parsedUrl.host}`;
    const date = new Date().toUTCString();
    const contentType = 'application/octet-stream';

    // 构建签名
    const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucketName}/${objectName}`;
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(stringToSign)
      .digest('base64');

    // 构建请求选项
    const options = {
      hostname: host,
      port: 443,
      path: `/${objectName}`,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        Host: host,
        Date: date,
        Authorization: `OSS ${accessKeyId}:${signature}`,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`上传失败，状态码: ${res.statusCode}, 响应: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(buffer);
      req.end();
    });
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
