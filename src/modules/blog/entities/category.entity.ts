import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column({ length: 50 })
  categoryName: string;

  @Column({ name: 'parent_id', default: 0 })
  parentId: number;
}
