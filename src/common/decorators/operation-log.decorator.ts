import { SetMetadata } from '@nestjs/common';

export const OPERATION_LOG_KEY = 'operation_log';

export enum OperationType {
  ADD = '新增',
  UPDATE = '修改',
  DELETE = '删除',
  QUERY = '查询',
  UPLOAD = '上传',
  DOWNLOAD = '下载',
  LOGIN = '登录',
  LOGOUT = '退出',
  OTHER = '其他',
}

/**
 * 操作日志装饰器
 * @param type 操作类型
 */
export const OperationLog = (type: OperationType | string) => SetMetadata(OPERATION_LOG_KEY, type);
