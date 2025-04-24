import { Injectable, Logger } from '@nestjs/common';
import { sensitiveWords as defaultSensitiveWords } from '../sensitiveWords';

export interface FilterResult {
  isSafe: boolean;
  filteredText: string;
  reasons?: string[];
  originalText?: string;
}

/**
 * 本地文本过滤服务
 * 提供基于敏感词库的文本内容过滤功能
 */
@Injectable()
export class LocalTextFilterService {
  private readonly logger = new Logger(LocalTextFilterService.name);

  /**
   * 本地敏感词过滤
   * @param text 待过滤文本
   * @returns 过滤结果
   */
  public filter(text: string): FilterResult {
    // 如果文本为空，直接返回安全
    if (!text || text.trim() === '') {
      return {
        isSafe: true,
        filteredText: text,
      };
    }

    // 使用默认敏感词列表
    const sensitiveWords = defaultSensitiveWords;

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

    return {
      isSafe: foundWords.length === 0,
      filteredText,
      reasons: foundWords.length > 0 ? ['存在敏感内容'] : undefined,
      originalText: foundWords.length > 0 ? text : undefined,
    };
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
