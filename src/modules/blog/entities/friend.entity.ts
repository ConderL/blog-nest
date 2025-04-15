import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('t_friend')
export class Friend extends BaseEntity {
  @Column({ name: 'link_name', length: 50 })
  linkName: string;

  @Column({ name: 'link_avatar', nullable: true })
  linkAvatar: string;

  @Column({ name: 'link_address', length: 100 })
  linkAddress: string;

  @Column({ name: 'link_intro', length: 200, nullable: true })
  linkIntro: string;

  @Column({ default: 1 })
  status: number;
}
