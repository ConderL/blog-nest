import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Article } from '../entities/article.entity';
import { Tag } from '../entities/tag.entity';
import { CategoryService } from './category.service';
import { TagService } from './tag.service';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
  ) {}

  /**
   * 创建文章
   */
  async create(article: Partial<Article>, tagIds: number[]): Promise<Article> {
    // 创建文章
    const newArticle = this.articleRepository.create(article);

    // 处理标签
    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.findBy({ id: In(tagIds) });
      newArticle.tags = tags;
    }

    // 保存文章
    return this.articleRepository.save(newArticle);
  }

  /**
   * 更新文章
   */
  async update(id: number, article: Partial<Article>, tagIds: number[]): Promise<Article> {
    const existingArticle = await this.findById(id);
    if (!existingArticle) {
      throw new Error('文章不存在');
    }

    // 更新文章基本信息
    const updatedArticle = Object.assign(existingArticle, article);

    // 处理标签
    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.findBy({ id: In(tagIds) });
      updatedArticle.tags = tags;
    } else {
      updatedArticle.tags = [];
    }

    // 保存更新
    return this.articleRepository.save(updatedArticle);
  }

  /**
   * 删除文章
   */
  async remove(id: number): Promise<void> {
    await this.articleRepository.delete(id);
  }

  /**
   * 获取文章列表
   */
  async findAll(
    page = 1,
    limit = 10,
    keyword?: string,
    categoryId?: number,
    tagId?: number,
    status?: number,
  ): Promise<{ items: Article[]; total: number }> {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tag')
      .leftJoinAndSelect('article.user', 'user')
      .where('article.isDelete = :isDelete', { isDelete: 0 });

    if (keyword) {
      queryBuilder.andWhere(
        '(article.articleTitle LIKE :keyword OR article.articleDesc LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    if (tagId) {
      queryBuilder.andWhere('tag.id = :tagId', { tagId });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('article.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .orderBy('article.isTop', 'DESC')
      .addOrderBy('article.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items, total };
  }

  /**
   * 根据ID获取文章
   */
  async findById(id: number): Promise<Article> {
    return this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'user'],
    });
  }

  /**
   * 增加文章阅读量（这个功能需要另外实现）
   */
}
