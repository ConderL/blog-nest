import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

interface CensorResult {
  isSafe: boolean;
  filteredText: string;
  reasons?: string[];
  originalText?: string;
}

/**
 * 百度文本审核服务
 * 使用百度内容审核平台API进行文本内容审核
 */
@Injectable()
export class BaiduTextCensorService {
  private readonly logger = new Logger(BaiduTextCensorService.name);
  private readonly API_KEY: string;
  private readonly SECRET_KEY: string;
  private accessToken: string;
  private tokenExpireTime: number;

  constructor(private readonly configService: ConfigService) {
    this.API_KEY = this.configService.get<string>('baidu.apiKey');
    this.SECRET_KEY = this.configService.get<string>('baidu.secretKey');
    this.accessToken = null;
    this.tokenExpireTime = 0;

    if (!this.API_KEY || !this.SECRET_KEY) {
      this.logger.warn('百度API密钥未配置，文本审核将使用本地过滤');
    } else {
      this.getAccessToken().catch((err) => {
        this.logger.error(`初始化百度API访问令牌失败: ${err.message}`);
      });
    }
  }

  /**
   * 获取百度API访问令牌
   */
  private async getAccessToken(): Promise<string> {
    // 如果令牌有效期内，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.API_KEY}&client_secret=${this.SECRET_KEY}`,
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 设置过期时间，提前5分钟过期以防万一
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
        this.logger.log('百度API访问令牌获取成功');
        return this.accessToken;
      }

      throw new Error('获取访问令牌失败: ' + JSON.stringify(response.data));
    } catch (error) {
      this.logger.error(`获取百度API访问令牌失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 文本审核
   * @param text 待审核文本
   * @returns 审核结果
   */
  async textCensor(text: string): Promise<CensorResult> {
    // 如果文本为空，直接返回安全
    if (!text || text.trim() === '') {
      return {
        isSafe: true,
        filteredText: text,
      };
    }

    console.log(this.API_KEY, this.SECRET_KEY);

    try {
      // 如果未配置API密钥，使用本地敏感词过滤
      if (!this.API_KEY || !this.SECRET_KEY) {
        return this.localFilter(text);
      }

      // 获取访问令牌
      const accessToken = await this.getAccessToken();
      console.log(accessToken, 'accessToken');
      // 调用百度文本审核API
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}`,
        `text=${encodeURIComponent(text)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // 解析审核结果
      const result = response.data;
      this.logger.debug(`百度文本审核结果: ${JSON.stringify(result)}`);

      // 响应格式参考：
      // {
      //   "log_id": 123456789,
      //   "conclusion": "不合规",
      //   "conclusionType": 2,  // 1:合规, 2:不合规, 3:疑似, 4:审核失败
      //   "data": [
      //     {
      //       "type": 11,
      //       "subType": 0,
      //       "conclusion": "不合规",
      //       "conclusionType": 2,
      //       "msg": "存在政治敏感不合规",
      //       "hits": [{"datasetName": "百度默认黑词库", "words": ["敏感词1", "敏感词2"]}]
      //     }
      //   ]
      // }

      // 如果审核成功
      if (result.conclusion) {
        let isSafe = result.conclusionType === 1; // 1表示合规
        let filteredText = text;
        const reasons = [];

        // 如果结果不合规或疑似，处理敏感词
        if (result.conclusionType === 2 || result.conclusionType === 3) {
          // 获取所有敏感词
          const sensitiveWords = new Set<string>();
          if (result.data && result.data.length > 0) {
            result.data.forEach((item) => {
              // 记录不合规原因
              reasons.push(item.msg);

              // 收集敏感词
              if (item.hits && item.hits.length > 0) {
                item.hits.forEach((hit) => {
                  if (hit.words && hit.words.length > 0) {
                    hit.words.forEach((word) => sensitiveWords.add(word));
                  }
                });
              }
            });
          }

          // 替换敏感词
          filteredText = text;
          sensitiveWords.forEach((word) => {
            // 使用星号替换敏感词，保持长度一致
            const replacement = '*'.repeat(word.length);
            // 使用全局替换
            const regex = new RegExp(this.escapeRegExp(word), 'g');
            filteredText = filteredText.replace(regex, replacement);
          });
        }

        return {
          isSafe,
          filteredText,
          reasons: reasons.length > 0 ? reasons : undefined,
          originalText: isSafe ? undefined : text,
        };
      }

      // 审核失败的情况
      this.logger.warn(`百度文本审核失败，使用本地过滤: ${JSON.stringify(result)}`);
      return this.localFilter(text);
    } catch (error) {
      this.logger.error(`百度文本审核异常: ${error.message}`);
      // 出错时使用本地过滤
      return this.localFilter(text);
    }
  }

  /**
   * 本地敏感词过滤（备用方案）
   * @param text 待过滤文本
   * @returns 过滤结果
   */
  private localFilter(text: string): Promise<CensorResult> {
    // 简单的敏感词列表（实际应用中可能会更复杂）
    const sensitiveWords = [
      '政治',
      '色情',
      '赌博',
      '毒品',
      '暴力',
      '恐怖',
      '歧视',
      '谩骂',
      '习近平',
      '共产党',
      '法轮功',
      '台独',
      '港独',
      '藏独',
      '六四',
    ];

    let filteredText = text;
    const foundWords = [];

    // 检测并替换敏感词
    sensitiveWords.forEach((word) => {
      if (text.includes(word)) {
        foundWords.push(word);
        // 替换为等长的星号
        const replacement = '*'.repeat(word.length);
        const regex = new RegExp(this.escapeRegExp(word), 'g');
        filteredText = filteredText.replace(regex, replacement);
      }
    });

    return Promise.resolve({
      isSafe: foundWords.length === 0,
      filteredText,
      reasons: foundWords.length > 0 ? ['存在敏感内容'] : undefined,
      originalText: foundWords.length > 0 ? text : undefined,
    });
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
