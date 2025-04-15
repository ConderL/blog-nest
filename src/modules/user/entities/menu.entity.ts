import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('menus')
export class Menu extends BaseEntity {
  @Column({ length: 50 })
  name: string;

  @Column({ length: 50 })
  path: string;

  @Column({ length: 50, nullable: true })
  component: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ name: 'parent_id', default: 0 })
  parentId: number;

  @Column({ name: 'order_num', default: 1 })
  orderNum: number;

  @Column({ default: false })
  hidden: boolean;

  @Column({ default: 1 })
  type: number;

  @Column({ nullable: true })
  perms: string;
}
