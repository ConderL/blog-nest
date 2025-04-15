import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Article } from './article.entity';
import { User } from '../../user/entities/user.entity';

/**
 * 评论实体
 */
@Entity('t_comment')
export class Comment extends BaseEntity {
  /**
   * 评论内容
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * 评论人IP
   */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  /**
   * IP地址源
   */
  @Column({ name: 'ip_source', nullable: true })
  ipSource: string;

  /**
   * 评论人设备
   */
  @Column({ nullable: true })
  device: string;

  /**
   * 父评论ID
   */
  @Column({ name: 'parent_id', default: 0 })
  parentId: number;

  /**
   * 回复评论ID
   */
  @Column({ name: 'reply_id', default: 0 })
  replyId: number;

  /**
   * 是否审核
   * 0-未审核，1-已审核
   */
  @Column({ name: 'is_review', default: 1 })
  isReview: number;

  /**
   * 文章ID
   */
  @Column({ name: 'article_id' })
  articleId: number;

  /**
   * 文章
   */
  @ManyToOne(() => Article)
  @JoinColumn({ name: 'article_id' })
  article: Article;

  /**
   * 用户ID
   */
  @Column({ name: 'user_id', nullable: true })
  userId: number;

  /**
   * 用户
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
