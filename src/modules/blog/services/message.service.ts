import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from '../entities/message.entity';
// import { CreateMessageDto } from '../dto/create-message.dto';
import { ReviewMessageDto } from '../dto/review-message.dto';
import { SiteConfig } from '../entities/site-config.entity';

/**
 * 留言板服务
 * 提供留言的增删改查功能
 */
@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(SiteConfig)
    private readonly siteConfigRepository: Repository<SiteConfig>,
  ) {}

  /**
   * 查询留言列表
   * @param current 当前页
   * @param size 每页数量
   * @param nickname 昵称(可选)
   * @param isCheck 审核状态(可选)
   * @param showAll 是否显示所有留言(包括未审核的)，默认为false
   * @returns 留言列表及分页信息
   */
  async findAll(
    current: number,
    size: number,
    nickname?: string,
    isCheck?: number,
    showAll: boolean = false,
  ) {
    this.logger.log(`查询留言列表：第${current}页，每页${size}条, showAll=${showAll}`);
    try {
      const queryBuilder = this.messageRepository.createQueryBuilder('message');

      // 默认只显示已审核的留言，除非明确指定审核状态或要求显示所有留言
      if (isCheck !== undefined && !Number.isNaN(isCheck)) {
        queryBuilder.andWhere('message.isCheck = :isCheck', { isCheck });
      } else if (!showAll) {
        // 如果未指定审核状态且不显示所有留言，则只显示已审核的留言
        queryBuilder.andWhere('message.isCheck = :isCheck', { isCheck: 1 });
      }

      if (nickname) {
        queryBuilder.andWhere('message.nickname LIKE :nickname', { nickname: `%${nickname}%` });
      }

      // 按创建时间倒序排列
      queryBuilder.orderBy('message.createTime', 'DESC');

      // 分页
      const total = await queryBuilder.getCount();
      const records = await queryBuilder
        .skip((current - 1) * size)
        .take(size)
        .getMany();

      this.logger.log(`查询留言列表成功，共${total}条记录`);
      return {
        records,
        count: records.length,
        current,
        size,
        total,
      };
    } catch (error) {
      this.logger.error(`查询留言列表失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 创建留言
   * @param createMessageDto 创建留言DTO
   * @returns 创建的留言
   */
  async create(createMessageDto: any) {
    this.logger.log(`创建留言：${JSON.stringify(createMessageDto)}`);
    try {
      // 获取站点配置，读取留言审核开关
      const [siteConfig] = await this.siteConfigRepository.find();

      // 如果开启留言审核，则设置为未审核(0)，否则设置为已审核(1)
      this.logger.log(
        `留言审核开关状态: ${siteConfig?.messageCheck ? '开启' : '关闭'}, 设置审核状态: ${siteConfig?.messageCheck}`,
      );

      const message = this.messageRepository.create({
        ...createMessageDto,
        isCheck: siteConfig?.messageCheck ? 0 : 1,
        createTime: new Date(),
        updateTime: new Date(),
      });
      const savedMessage = await this.messageRepository.save(message);

      // 处理可能返回数组的情况
      const result = Array.isArray(savedMessage) ? savedMessage[0] : savedMessage;

      this.logger.log(`创建留言成功，ID：${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`创建留言失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 审核留言
   * @param id 留言ID
   * @param reviewMessageDto 审核留言DTO
   * @returns 更新结果
   */
  async review(id: number, reviewMessageDto: ReviewMessageDto) {
    this.logger.log(`审核留言，ID：${id}，审核状态：${reviewMessageDto.isCheck}`);
    try {
      const result = await this.messageRepository.update(id, {
        isCheck: reviewMessageDto.isCheck,
        updateTime: new Date(),
      });
      this.logger.log(`审核留言成功，ID：${id}`);
      return result;
    } catch (error) {
      this.logger.error(`审核留言失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 更新留言审核状态
   * @param id 留言ID
   * @param isCheck 审核状态(1-通过,0-不通过)
   * @returns 更新结果
   */
  async updateStatus(id: number, isCheck: number) {
    this.logger.log(`更新留言审核状态，ID：${id}，审核状态：${isCheck}`);
    try {
      const result = await this.messageRepository.update(id, {
        isCheck,
        updateTime: new Date(),
      });
      this.logger.log(`更新留言审核状态成功，ID：${id}`);
      return result;
    } catch (error) {
      this.logger.error(`更新留言审核状态失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 删除留言
   * @param id 留言ID
   * @returns 删除结果
   */
  async remove(ids: number[]) {
    if (!ids || ids.length === 0) {
      return;
    }

    const comments = await this.messageRepository.findBy({ id: In(ids) });
    if (comments.length > 0) {
      await this.messageRepository.remove(comments);
    }
  }

  /**
   * 根据ID查询留言
   * @param id 留言ID
   * @returns 留言信息
   */
  async findById(id: number) {
    this.logger.log(`查询留言，ID：${id}`);
    try {
      const message = await this.messageRepository.findOne({ where: { id } });
      this.logger.log(`查询留言成功，ID：${id}`);
      return message;
    } catch (error) {
      this.logger.error(`查询留言失败：${error.message}`);
      throw error;
    }
  }
}
