import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * 创建标签
   */
  async create(tag: Partial<Tag>): Promise<Tag> {
    const newTag = this.tagRepository.create(tag);
    return this.tagRepository.save(newTag);
  }

  /**
   * 更新标签
   */
  async update(id: number, tag: Partial<Tag>): Promise<Tag> {
    await this.tagRepository.update(id, tag);
    return this.findById(id);
  }

  /**
   * 删除标签
   */
  async remove(id: number): Promise<void> {
    await this.tagRepository.delete(id);
  }

  /**
   * 获取标签列表
   */
  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find();
  }

  /**
   * 根据ID获取标签
   */
  async findById(id: number): Promise<Tag> {
    return this.tagRepository.findOne({ where: { id } });
  }

  /**
   * 根据名称获取标签
   */
  async findByName(tagName: string): Promise<Tag> {
    return this.tagRepository.findOne({ where: { tagName } });
  }

  /**
   * 查找或创建标签
   */
  async findOrCreate(tagName: string): Promise<Tag> {
    let tag = await this.findByName(tagName);
    if (!tag) {
      tag = await this.create({ tagName });
    }
    return tag;
  }
}
