import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
    try {
      console.log('创建评论:', comment);
      // 创建新评论
      const newComment = this.commentRepository.create(comment);
      const savedComment = await this.commentRepository.save(newComment);
      console.log('评论创建成功, ID:', savedComment.id);
      return savedComment;
    } catch (error) {
      console.error('创建评论失败:', error);
      throw error;
    }
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
   * @param page 页码
   * @param limit 每页条数
   * @param typeId 类型ID (如文章ID)
   * @param commentType 评论类型 (1-文章评论,2-友链评论,3-说说评论)
   * @returns 评论列表和总数
   */
  async findAll(
    page: number,
    limit: number,
    typeId?: number | null,
    commentType?: number | null,
  ): Promise<[Comment[], number]> {
    try {
      console.log(
        `查询评论列表: page=${page}, limit=${limit}, typeId=${typeId}, commentType=${commentType}`,
      );

      const query = this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .leftJoinAndSelect('comment.article', 'article')
        .where('(comment.parentId IS NULL OR comment.parentId = 0)'); // 只查询顶级评论

      // 根据类型ID筛选
      if (typeId !== null && typeId !== undefined) {
        query.andWhere('comment.typeId = :typeId', { typeId });
      }

      // 根据评论类型筛选
      if (commentType !== null && commentType !== undefined) {
        query.andWhere('comment.commentType = :commentType', { commentType });
      }

      // 使用id字段排序，避免可能的日期问题
      const result = await query
        .orderBy('comment.id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      console.log(`查询评论列表结果: 总数=${result[1]}, 当前页数量=${result[0].length}`);
      return result;
    } catch (error) {
      console.error('查询评论列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取文章评论列表(含子评论)
   * @param articleId 文章ID
   */
  async findByArticleId(articleId: number): Promise<Comment[]> {
    try {
      console.log(`获取文章评论列表, 文章ID: ${articleId}`);

      // 查询所有与该文章相关的评论
      const comments = await this.commentRepository.find({
        where: {
          typeId: articleId,
          commentType: 1, // 文章评论类型
          parentId: 0, // 只查询顶级评论
        },
        relations: ['user'],
        order: {
          id: 'DESC' as any, // 使用ID排序更可靠
        },
      });

      console.log(`文章顶级评论数量: ${comments.length}`);

      // 为每个顶级评论查询子评论
      for (const comment of comments) {
        // 查询直接回复这个评论的子评论
        const replies = await this.commentRepository.find({
          where: {
            parentId: comment.id,
          },
          relations: ['user'],
          order: {
            id: 'DESC' as any,
          },
          take: 3, // 默认只取3条子评论，其他的通过单独API获取
        });

        // 设置replyCount
        const replyCount = await this.commentRepository.count({
          where: {
            parentId: comment.id,
          },
        });

        // 初始化子评论数组
        comment.children = replies;

        // 设置回复数量
        comment['replyCount'] = replyCount;
      }

      return comments;
    } catch (error) {
      console.error('获取文章评论列表失败:', error);
      throw error;
    }
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
  async remove(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }
    const comments = await this.commentRepository.findBy({ id: In(ids) });
    if (comments.length > 0) {
      await this.commentRepository.remove(comments);
    }
  }

  /**
   * 获取评论树
   * @param articleId 文章ID
   * @returns 评论树
   */
  async findTree(articleId: number): Promise<Comment[]> {
    try {
      // 获取所有根评论（无父评论）
      const rootComments = await this.commentRepository.find({
        where: {
          typeId: articleId,
          parentId: 0,
          commentType: 1, // 文章评论
        },
        order: { id: 'DESC' } as any, // 使用ID排序更可靠
        relations: ['user', 'article'],
      });

      return rootComments;
    } catch (error) {
      console.error('获取评论树失败:', error);
      throw error;
    }
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

    // 按ID排序，避免可能的日期问题
    if (comment.children.length > 0) {
      comment.children.sort((a, b) => b.id - a.id); // 降序排列，新评论在前
    }

    return comment;
  }

  /**
   * 后台查询评论列表 - 支持更多筛选条件
   */
  async findAllForAdmin(
    page: number,
    limit: number,
    articleId?: number,
    keyword?: string,
    isReview?: number,
  ): Promise<[Comment[], number]> {
    try {
      const queryBuilder = this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .leftJoinAndSelect('comment.article', 'article')
        .where('1 = 1'); // 默认条件，允许添加更多筛选

      // 按文章ID筛选
      if (articleId) {
        queryBuilder.andWhere('comment.type_id = :articleId', { articleId });
      }

      // 按评论内容关键词筛选
      if (keyword) {
        queryBuilder.andWhere('comment.comment_content LIKE :keyword', { keyword: `%${keyword}%` });
      }

      // 按审核状态筛选
      if (isReview !== undefined && isReview !== null) {
        queryBuilder.andWhere('comment.is_check = :isReview', { isReview });
      }

      // 返回结果，按id倒序排列
      return queryBuilder
        .orderBy('comment.id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
    } catch (error) {
      console.error('后台查询评论列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取最新评论
   * @returns 最新的一条评论
   */
  async getRecentComments(): Promise<Comment> {
    try {
      console.log('获取最新评论');

      // 查询最新的一条已审核评论
      const comment = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .leftJoinAndSelect('comment.article', 'article')
        .where('comment.isReview = :isReview', { isReview: 1 }) // 只获取已审核的评论
        .orderBy('comment.id', 'DESC') // 按ID倒序，获取最新评论
        .take(1)
        .getOne();

      console.log(`获取最新评论 ${comment ? '成功' : '无评论'}`);
      return comment;
    } catch (error) {
      console.error('获取最新评论失败:', error);
      throw error;
    }
  }

  /**
   * 获取评论的回复列表
   * @param commentId 评论ID
   * @param page 页码
   * @param limit 每页条数
   * @returns 回复列表
   */
  async getReplies(commentId: number, page: number, limit: number): Promise<Comment[]> {
    try {
      console.log(`获取评论回复, commentId=${commentId}, page=${page}, limit=${limit}`);

      // 查询回复该评论的所有子评论
      const replies = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .where('comment.parentId = :parentId', { parentId: commentId })
        .orderBy('comment.id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      console.log(`获取到${replies.length}条回复`);

      // 打印关键字段检查
      for (const reply of replies) {
        console.log(`回复ID: ${reply.id}, 用户ID: ${reply.userId}, 被回复用户ID: ${reply.toUid}`);
      }

      return replies;
    } catch (error) {
      console.error('获取评论回复失败:', error);
      throw error;
    }
  }

  /**
   * 获取评论的回复数量
   * @param commentId 评论ID
   * @returns 回复数量
   */
  async getReplyCount(commentId: number): Promise<number> {
    try {
      // 统计回复该评论的子评论数量
      const count = await this.commentRepository.count({
        where: {
          parentId: commentId,
        },
      });

      console.log(`评论ID ${commentId} 的回复数量: ${count}`);
      return count;
    } catch (error) {
      console.error(`获取评论回复数量失败, commentId=${commentId}`, error);
      return 0;
    }
  }

  /**
   * 通过ID查找用户
   * @param userId 用户ID
   * @returns 用户信息
   */
  async findUserById(userId: number): Promise<any> {
    try {
      // 查询任何带有指定用户ID的评论，然后提取用户信息
      const comment = await this.commentRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      // 如果找到带有用户信息的评论，返回用户信息
      if (comment?.user) {
        return comment.user;
      }

      return null;
    } catch (error) {
      console.error(`查找用户失败, 用户ID: ${userId}`, error);
      return null;
    }
  }

  /**
   * 点赞评论
   * @param commentId 评论ID
   * @returns 更新后的评论信息，包含最新点赞数
   */
  async likeComment(commentId: number): Promise<Comment> {
    try {
      console.log(`点赞评论, ID: ${commentId}`);

      // 获取当前评论
      const comment = await this.findById(commentId);
      if (!comment) {
        throw new Error(`评论不存在, ID: ${commentId}`);
      }

      // 更新点赞数量 (+1)
      comment.likeCount = (comment.likeCount || 0) + 1;

      // 保存更新
      await this.commentRepository.update(commentId, { likeCount: comment.likeCount });

      console.log(`评论点赞成功, ID: ${commentId}, 当前点赞数: ${comment.likeCount}`);
      return comment;
    } catch (error) {
      console.error(`点赞评论失败, 评论ID: ${commentId}`, error);
      throw error;
    }
  }
}
