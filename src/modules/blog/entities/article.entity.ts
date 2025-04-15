import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'article_cover', nullable: true })
  articleCover: string;

  @Column({ name: 'article_title', length: 100 })
  articleTitle: string;

  @Column({ name: 'article_desc', length: 200, nullable: true })
  articleDesc: string;

  @Column({ name: 'article_content', type: 'text' })
  articleContent: string;

  @Column({ name: 'article_type', default: 1 })
  articleType: number;

  @Column({ name: 'is_top', default: 0 })
  isTop: number;

  @Column({ name: 'is_delete', default: 0 })
  isDelete: number;

  @Column({ name: 'is_recommend', default: 0 })
  isRecommend: number;

  @Column({ default: 1 })
  status: number;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'article_tags',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
