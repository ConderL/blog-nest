import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ name: 'comment_type', default: 1 })
  commentType: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'parent_id', default: 0 })
  parentId: number;

  @Column({ name: 'reply_id', default: 0 })
  replyId: number;

  @Column({ name: 'comment_content', type: 'text' })
  commentContent: string;

  @Column({ name: 'from_uid' })
  fromUid: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_uid' })
  fromUser: User;

  @Column({ name: 'to_uid', default: 0 })
  toUid: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_uid' })
  toUser: User;

  @Column({ name: 'is_check', default: 0 })
  isCheck: number;
}
