import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';

/**
 * 文章实体
 */
@Entity('t_article')
export class Article extends BaseEntity {
  /**
   * 文章标题
   */
  @Column({ name: 'article_title', length: 100 })
  articleTitle: string;

  /**
   * 文章内容
   */
  @Column({ name: 'article_content', type: 'text' })
  articleContent: string;

  /**
   * 文章描述
   */
  @Column({ name: 'article_desc', length: 200, nullable: true })
  articleDesc: string;

  /**
   * 文章状态（1-公开，2-私密，3-草稿）
   */
  @Column({ default: 1 })
  status: number;

  /**
   * 是否置顶（0-否，1-是）
   */
  @Column({ name: 'is_top', default: 0 })
  isTop: number;

  /**
   * 是否删除（0-否，1-是）
   */
  @Column({ name: 'is_delete', default: 0 })
  isDelete: number;

  /**
   * 是否允许评论（0-否，1-是）
   */
  @Column({ name: 'is_comment', default: 1 })
  isComment: number;

  /**
   * 文章封面
   */
  @Column({ name: 'article_cover', nullable: true })
  articleCover: string;

  /**
   * 原文链接（转载文章使用）
   */
  @Column({ name: 'original_url', nullable: true })
  originalUrl: string;

  /**
   * 阅读量
   */
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  /**
   * 点赞量
   */
  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  /**
   * 分类ID
   */
  @Column({ name: 'category_id' })
  categoryId: number;

  /**
   * 分类
   */
  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  /**
   * 标签
   */
  @ManyToMany(() => Tag)
  @JoinTable({
    name: 't_article_tag',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
