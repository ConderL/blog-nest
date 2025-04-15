import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('visit_log')
export class VisitLog extends BaseEntity {
  @Column({ name: 'ip', comment: '访问IP地址' })
  ip: string;

  @Column({ name: 'user_agent', nullable: true, comment: '用户代理信息' })
  userAgent: string;

  @Column({ name: 'browser', nullable: true, comment: '浏览器类型' })
  browser: string;

  @Column({ name: 'os', nullable: true, comment: '操作系统' })
  os: string;

  @Column({ name: 'url', comment: '访问的URL' })
  url: string;

  @Column({ name: 'page', comment: '访问的页面名称' })
  page: string;

  @Column({ name: 'referer', nullable: true, comment: '来源页面' })
  referer: string;

  @Column({ name: 'user_id', nullable: true, comment: '访问用户ID' })
  userId: number;

  @Column({ name: 'stay_time', nullable: true, comment: '停留时间(秒)' })
  stayTime: number;

  @Column({ name: 'ip_location', nullable: true, comment: 'IP地理位置' })
  ipLocation: string;

  @Column({ name: 'device', nullable: true, comment: '设备类型' })
  device: string;
}
