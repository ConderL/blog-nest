import { Request } from 'express';

/**
 * 获取客户端IP地址
 * @param request 请求对象
 */
export function getClientIp(request: Request): string {
  // 获取 X-Forwarded-For 头部信息
  const xForwardedFor = request.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    // 多层代理时，取第一个 IP
    return xForwardedFor.split(',')[0].trim();
  }

  // 获取 X-Real-IP 头部信息 (Nginx代理通常使用)
  const xRealIp = request.headers['x-real-ip'] as string;
  if (xRealIp) {
    return xRealIp;
  }

  // 获取 Proxy-Client-IP
  const proxyClientIp = request.headers['proxy-client-ip'] as string;
  if (proxyClientIp) {
    return proxyClientIp;
  }

  // 获取 WL-Proxy-Client-IP
  const wlProxyClientIp = request.headers['wl-proxy-client-ip'] as string;
  if (wlProxyClientIp) {
    return wlProxyClientIp;
  }

  // 获取 HTTP_CLIENT_IP
  const httpClientIp = request.headers['http_client_ip'] as string;
  if (httpClientIp) {
    return httpClientIp;
  }

  // 获取 HTTP_X_FORWARDED_FOR
  const httpXForwardedFor = request.headers['http_x_forwarded_for'] as string;
  if (httpXForwardedFor) {
    return httpXForwardedFor;
  }

  // 直接获取请求的 IP
  return request.ip || '127.0.0.1';
}

/**
 * 判断IP是否为内网IP
 * @param ip IP地址
 */
export function isInternalIp(ip: string): boolean {
  // IPv4 内网地址段
  // 10.0.0.0/8
  // 172.16.0.0/12
  // 192.168.0.0/16
  // 127.0.0.0/8

  // 去除IPv6前缀
  if (ip.includes('::ffff:')) {
    ip = ip.substring(7);
  }

  const ipParts = ip.split('.');
  if (ipParts.length !== 4) {
    return false;
  }

  const firstOctet = parseInt(ipParts[0], 10);
  const secondOctet = parseInt(ipParts[1], 10);

  return (
    firstOctet === 10 || // 10.0.0.0/8
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) || // 172.16.0.0/12
    (firstOctet === 192 && secondOctet === 168) || // 192.168.0.0/16
    firstOctet === 127 // 127.0.0.0/8
  );
}
