import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('t_tag')
export class Tag extends BaseEntity {
  @Column({ length: 50 })
  tagName: string;
}
