import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('t_user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100 })
  password: string;

  @Column({ length: 50, nullable: true })
  nickname: string;

  @Column({ length: 50, nullable: true })
  avatar: string;

  @Column({ length: 50, nullable: true })
  email: string;

  @Column({ default: 1 })
  status: number;

  @Column({ length: 50, nullable: true })
  ipAddress: string;

  @Column({ length: 50, nullable: true })
  ipSource: string;

  @Column({ length: 50, nullable: true })
  lastLoginTime: string;

  @CreateDateColumn()
  createTime: Date;

  @UpdateDateColumn()
  updateTime: Date;
}
