import { Entity, PrimaryColumn } from 'typeorm';

@Entity('role_menus')
export class RoleMenu {
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  @PrimaryColumn({ name: 'menu_id' })
  menuId: number;
}
