import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

/**
 * 评论服务
 * 提供评论的增删改查功能
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  /**
   * 创建评论
   * @param comment 评论数据
   * @returns 创建后的评论
   */
  async create(comment: Partial<Comment>): Promise<Comment> {
    // 创建新评论
    const newComment = this.commentRepository.create(comment);
    return this.commentRepository.save(newComment);
  }

  /**
   * 查找评论
   * @param id 评论ID
   * @returns 评论详情
   */
  async findById(id: number): Promise<Comment> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'article'],
    });
  }

  /**
   * 获取评论列表
   * @param page 页码
   * @param limit 每页数量
   * @param articleId 文章ID
   * @returns 评论列表和总数
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    articleId?: number,
  ): Promise<{ items: Comment[]; total: number }> {
    // 构建查询条件
    const queryBuilder = this.commentRepository.createQueryBuilder('comment');

    // 如果有文章ID，则根据文章ID筛选
    if (articleId) {
      queryBuilder.where('comment.articleId = :articleId', { articleId });
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const items = await queryBuilder
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.article', 'article')
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items, total };
  }

  /**
   * 更新评论
   * @param id 评论ID
   * @param updateData 更新数据
   * @returns 更新后的评论
   */
  async update(id: number, updateData: Partial<Comment>): Promise<Comment> {
    await this.commentRepository.update(id, updateData);
    return this.findById(id);
  }

  /**
   * 删除评论
   * @param id 评论ID
   */
  async remove(id: number): Promise<void> {
    await this.commentRepository.delete(id);
  }

  /**
   * 获取评论树
   *
   * @param articleId 文章ID
   * @returns 评论树
   */
  async findTree(articleId: number): Promise<Comment[]> {
    // 获取所有根评论（无父评论）
    const rootComments = await this.commentRepository.find({
      where: { articleId, parentId: 0 },
      order: { createdAt: 'DESC' },
      relations: ['user', 'article'],
    });

    // 递归获取子评论
    return rootComments;
  }

  /**
   * 查找子评论
   */
  private async findChildren(comment: Comment): Promise<void> {
    const children = await this.commentRepository.find({
      where: { parentId: comment.id },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'ASC' },
    });

    comment['children'] = children;

    for (const child of children) {
      await this.findChildren(child);
    }
  }
}
