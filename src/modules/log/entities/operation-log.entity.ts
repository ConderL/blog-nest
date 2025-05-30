import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * 操作日志实体
 */
@Entity('t_operation_log')
export class OperationLog extends BaseEntity {
  /**
   * 操作id
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 操作模块
   */
  @Column({ length: 20 })
  module: string;

  /**
   * 操作类型
   */
  @Column({ length: 20 })
  type: string;

  /**
   * 操作uri
   */
  @Column({ length: 255 })
  uri: string;

  /**
   * 方法名称
   */
  @Column({ length: 255 })
  name: string;

  /**
   * 操作描述
   */
  @Column({ length: 255 })
  description: string;

  /**
   * 请求参数
   */
  @Column({ type: 'longtext' })
  params: string;

  /**
   * 请求方式
   */
  @Column({ length: 20 })
  method: string;

  /**
   * 返回数据
   */
  @Column({ type: 'longtext' })
  data: string;

  /**
   * 用户id
   */
  @Column({ name: 'user_id' })
  user_id: number;

  /**
   * 用户昵称
   */
  @Column({ length: 50 })
  nickname: string;

  /**
   * 操作ip
   */
  @Column({ length: 50, name: 'ip_address' })
  ip_address: string;

  /**
   * 操作地址
   */
  @Column({ length: 50, name: 'ip_source' })
  ip_source: string;

  /**
   * 操作耗时 (毫秒)
   */
  @Column()
  times: number;
}
