import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * 操作日志实体
 */
@Entity('t_operation_log')
export class OperationLog extends BaseEntity {
  /**
   * 操作用户ID
   */
  @Column({ name: 'user_id', nullable: true, comment: '操作用户ID' })
  userId: number;

  /**
   * 操作用户名
   */
  @Column({ name: 'username', nullable: true, comment: '操作用户名' })
  username: string;

  /**
   * 操作模块
   */
  @Column({ name: 'module', nullable: true, comment: '操作模块' })
  module: string;

  /**
   * 操作类型
   */
  @Column({ name: 'type', nullable: false, comment: '操作类型' })
  type: string;

  /**
   * 操作描述
   */
  @Column({ name: 'description', nullable: true, comment: '操作描述' })
  description: string;

  /**
   * 请求方法
   */
  @Column({ name: 'method', nullable: true, comment: '请求方法' })
  method: string;

  /**
   * 请求路径
   */
  @Column({ name: 'path', nullable: true, comment: '请求路径' })
  path: string;

  /**
   * 请求参数
   */
  @Column({ name: 'params', type: 'text', nullable: true, comment: '请求参数' })
  params: string;

  /**
   * 请求IP
   */
  @Column({ name: 'ip', nullable: true, comment: '请求IP' })
  ip: string;

  /**
   * IP来源
   */
  @Column({ name: 'ip_source', nullable: true, comment: 'IP来源' })
  ipSource: string;

  /**
   * 操作状态（1成功, 0失败）
   */
  @Column({ name: 'status', default: 1, comment: '操作状态（1成功, 0失败）' })
  status: number;

  /**
   * 操作耗时(ms)
   */
  @Column({ name: 'time', nullable: true, comment: '操作耗时(ms)' })
  time: number;

  /**
   * 操作结果
   */
  @Column({ name: 'result', type: 'text', nullable: true, comment: '操作结果' })
  result: string;

  /**
   * 用户代理
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true, comment: '用户代理' })
  userAgent: string;
}
