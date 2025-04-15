import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('article_tags')
export class ArticleTag {
  @PrimaryColumn({ name: 'article_id' })
  articleId: number;

  @PrimaryColumn({ name: 'tag_id' })
  tagId: number;
}
