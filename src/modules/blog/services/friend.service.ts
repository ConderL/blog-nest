import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friend } from '../entities/friend.entity';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
  ) {}

  /**
   * 创建友链
   */
  async create(friend: Partial<Friend>): Promise<Friend> {
    const newFriend = this.friendRepository.create(friend);
    return this.friendRepository.save(newFriend);
  }

  /**
   * 更新友链
   */
  async update(id: number, friend: Partial<Friend>): Promise<Friend> {
    await this.friendRepository.update(id, friend);
    return this.findById(id);
  }

  /**
   * 删除友链
   */
  async remove(id: number): Promise<void> {
    await this.friendRepository.delete(id);
  }

  /**
   * 获取友链列表
   */
  async findAll(status?: number): Promise<Friend[]> {
    const condition = status !== undefined ? { status } : {};
    return this.friendRepository.find({
      where: condition,
      order: { createdAt: 'DESC' } as any,
    });
  }

  /**
   * 根据ID获取友链
   */
  async findById(id: number): Promise<Friend> {
    return this.friendRepository.findOne({ where: { id } });
  }
}
