import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * 创建评论
   */
  async create(comment: Partial<Comment>): Promise<Comment> {
    const newComment = this.commentRepository.create(comment);
    return this.commentRepository.save(newComment);
  }

  /**
   * 删除评论
   */
  async remove(id: number): Promise<void> {
    await this.commentRepository.delete(id);
  }

  /**
   * 获取评论列表
   */
  async findAll(
    page = 1,
    limit = 10,
    typeId?: number,
    commentType?: number,
  ): Promise<{ items: Comment[]; total: number }> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.fromUser', 'fromUser')
      .leftJoinAndSelect('comment.toUser', 'toUser')
      .where('1 = 1');

    if (typeId) {
      queryBuilder.andWhere('comment.typeId = :typeId', { typeId });
    }

    if (commentType) {
      queryBuilder.andWhere('comment.commentType = :commentType', { commentType });
    }

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items, total };
  }

  /**
   * 获取评论树
   */
  async findTree(typeId: number, commentType: number): Promise<Comment[]> {
    const comments = await this.commentRepository.find({
      where: { typeId, commentType, parentId: 0 },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });

    for (const comment of comments) {
      await this.findChildren(comment);
    }

    return comments;
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

  /**
   * 根据ID获取评论
   */
  async findById(id: number): Promise<Comment> {
    return this.commentRepository.findOne({
      where: { id },
      relations: ['fromUser', 'toUser'],
    });
  }
}
