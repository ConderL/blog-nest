import { SetMetadata } from '@nestjs/common';

export const VISIT_LOG_KEY = 'visit_log';

/**
 * 访问日志装饰器
 * @param pageName 页面名称
 */
export const VisitLog = (pageName: string) => SetMetadata(VISIT_LOG_KEY, pageName);
