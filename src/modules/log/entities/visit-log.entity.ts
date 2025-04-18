import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('t_visit_log')
export class VisitLog extends BaseEntity {
  @Column({ name: 'page', length: 50, nullable: true })
  page: string;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ip: string;

  @Column({ name: 'ip_source', length: 50, nullable: true })
  ipSource: string;

  @Column({ name: 'os', length: 50, nullable: true })
  os: string;

  @Column({ name: 'browser', length: 50, nullable: true })
  browser: string;

  @Column({ name: 'referer', length: 255, nullable: true })
  referer: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  // 兼容性getter
  get userAgent(): string {
    return null;
  }

  get url(): string {
    return this.page;
  }

  get stayTime(): number {
    return null;
  }

  get ipLocation(): string {
    return this.ipSource;
  }

  get device(): string {
    return null;
  }
}
