import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('site_config')
export class SiteConfig extends BaseEntity {
  @Column({ name: 'config_name' })
  configName: string;

  @Column({ name: 'config_value', type: 'text' })
  configValue: string;

  @Column({ name: 'is_frontend', default: 0 })
  isFrontend: number;

  @Column()
  remark: string;
}
