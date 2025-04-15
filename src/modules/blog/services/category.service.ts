import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * 创建分类
   */
  async create(category: Partial<Category>): Promise<Category> {
    const newCategory = this.categoryRepository.create(category);
    return this.categoryRepository.save(newCategory);
  }

  /**
   * 更新分类
   */
  async update(id: number, category: Partial<Category>): Promise<Category> {
    await this.categoryRepository.update(id, category);
    return this.findById(id);
  }

  /**
   * 删除分类
   */
  async remove(id: number): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  /**
   * 获取分类列表
   */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  /**
   * 获取分类树
   */
  async findTree(): Promise<Category[]> {
    const categories = await this.categoryRepository.find();
    return this.buildTree(categories);
  }

  /**
   * 构建分类树
   */
  private buildTree(categories: Category[]): Category[] {
    const result: Category[] = [];
    const map = {};

    // 创建一个临时的Map，将所有分类按ID映射
    categories.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    // 构建树结构
    categories.forEach((item) => {
      if (item.parentId === 0) {
        // 根分类
        result.push(map[item.id]);
      } else {
        // 子分类，添加到父分类的children中
        if (map[item.parentId]) {
          map[item.parentId].children.push(map[item.id]);
        }
      }
    });

    return result;
  }

  /**
   * 根据ID获取分类
   */
  async findById(id: number): Promise<Category> {
    return this.categoryRepository.findOne({ where: { id } });
  }
}
