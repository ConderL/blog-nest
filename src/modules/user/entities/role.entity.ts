import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ length: 50 })
  roleName: string;

  @Column({ name: 'role_label', length: 50, unique: true })
  roleLabel: string;

  @Column({ type: 'text', nullable: true })
  remark: string;
}
