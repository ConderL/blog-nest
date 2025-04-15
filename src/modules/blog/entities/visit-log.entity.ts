import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('visit_logs')
export class VisitLog extends BaseEntity {
  @Column({ name: 'page_url' })
  pageUrl: string;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ name: 'ip_source', nullable: true })
  ipSource: string;

  @Column({ name: 'os', nullable: true })
  os: string;

  @Column({ name: 'browser', nullable: true })
  browser: string;

  @Column({ nullable: true })
  referer: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;
}
