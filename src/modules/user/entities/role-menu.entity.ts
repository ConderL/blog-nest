import { Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('t_role_menu')
export class RoleMenu {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  @PrimaryColumn({ name: 'menu_id' })
  menuId: number;
}
