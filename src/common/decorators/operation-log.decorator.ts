import { SetMetadata } from '@nestjs/common';
import { OperationType } from '../enums/operation-type.enum';

export const OPERATION_LOG_KEY = 'operation_log';

/**
 * 操作日志装饰器
 * 用于标记需要记录操作日志的方法
 * @param type 操作类型
 * @returns 装饰器
 */
export const OperationLog = (type: OperationType) => SetMetadata(OPERATION_LOG_KEY, type);
