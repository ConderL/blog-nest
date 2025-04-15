import { Request } from 'express';
import axios from 'axios';
import { getCurrentRequest } from './request.util';

/**
 * IP工具类
 * 提供IP地址相关的工具方法，如获取客户端IP、判断是否为内网IP等
 */
export class IPUtil {
  /**
   * 获取客户端IP地址
   * @param request 请求对象
   * @returns 客户端IP地址
   */
  static getClientIp(request: Request): string {
    // 尝试从各种header中获取
    let ip: string = null;

    // 检查X-Forwarded-For头
    if (request.headers['x-forwarded-for']) {
      const forwardedIps = request.headers['x-forwarded-for'];
      if (Array.isArray(forwardedIps)) {
        ip = forwardedIps[0];
      } else {
        ip = forwardedIps.split(',')[0].trim();
      }
    }

    // 检查X-Real-IP头
    if (!ip && request.headers['x-real-ip']) {
      ip = request.headers['x-real-ip'] as string;
    }

    // 从连接中获取
    if (!ip && request.connection && request.connection.remoteAddress) {
      ip = request.connection.remoteAddress;
    }

    // 清理IPv6前缀
    if (ip && ip.indexOf('::ffff:') !== -1) {
      ip = ip.substring(7);
    }

    return ip || '127.0.0.1';
  }

  /**
   * 判断是否为内网IP
   *
   * @param ip 要检查的IP地址
   * @returns 是否为内网IP
   */
  static isInternalIp(ip: string): boolean {
    if (!ip) return false;

    // 判断是否是本地回环地址
    if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
      return true;
    }

    // 内网IP段的正则表达式
    const patterns = [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, // 10.0.0.0 - 10.255.255.255
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0 - 172.31.255.255
      /^192\.168\.\d{1,3}\.\d{1,3}$/, // 192.168.0.0 - 192.168.255.255
    ];

    // 检查IP是否匹配内网IP段
    for (const pattern of patterns) {
      if (pattern.test(ip)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取当前请求对象
   * @returns 请求对象
   */
  static getRequestObject(): Request {
    return getCurrentRequest();
  }

  /**
   * 获取IP地理位置
   * @param ip IP地址
   * @returns IP地理位置信息
   */
  static async getIpSource(ip: string): Promise<string> {
    // 如果是内网IP或本地IP，直接返回
    if (this.isInternalIp(ip) || ip === '127.0.0.1') {
      return '内网IP';
    }

    try {
      // 使用ip-api.com免费API获取IP地理位置
      const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      const data = response.data;

      if (data.status === 'success') {
        return `${data.country || ''} ${data.regionName || ''} ${data.city || ''}`;
      }

      return '未知位置';
    } catch (error) {
      console.error('获取IP地址位置失败:', error);
      return '未知位置';
    }
  }
}

// 导出实例以便于单例使用
export const IP_UTIL = new IPUtil();
