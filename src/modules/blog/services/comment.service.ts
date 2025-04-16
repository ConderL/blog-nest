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
   * 查询评论列表
   */
  async findAll(page: number, limit: number, articleId?: number): Promise<[Comment[], number]> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.article', 'article')
      .where('comment.isDelete = :isDelete', { isDelete: 0 });

    if (articleId) {
      queryBuilder.andWhere('comment.articleId = :articleId', { articleId });
    }

    return queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  /**
   * 获取文章评论列表(含子评论)
   */
  async findByArticleId(articleId: number): Promise<Comment[]> {
    // 查询所有与该文章相关的评论
    const comments = await this.commentRepository.find({
      where: {
        articleId,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // 找出所有顶级评论（无父评论的评论）
    const topComments = comments.filter((comment) => !comment.parentId);

    // 为每个顶级评论构建评论树
    for (const comment of topComments) {
      this.findChildren(comment, comments);
    }

    return topComments;
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
   * 递归查找子评论
   * @param comment 当前评论
   * @param allComments 所有评论
   */
  private findChildren(comment: Comment, allComments: Comment[]) {
    // 初始化子评论数组
    comment.children = [];

    // 查找直接回复当前评论的评论
    for (const childComment of allComments) {
      if (childComment.parentId === comment.id) {
        // 递归查找子评论的子评论
        this.findChildren(childComment, allComments);
        // 添加到当前评论的子评论数组
        comment.children.push(childComment);
      }
    }

    // 按创建时间排序
    if (comment.children.length > 0) {
      comment.children.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    return comment;
  }
}
