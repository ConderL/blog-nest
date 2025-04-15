import { Entity, PrimaryColumn } from 'typeorm';

@Entity('t_user_role')
export class UserRole {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'role_id' })
  roleId: number;
}
