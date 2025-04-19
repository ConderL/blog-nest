import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Put,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ArticleService } from '../services/article.service';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Article } from '../entities/article.entity';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { CreateArticleDto } from '../dtos/create-article.dto';
import { UpdateArticleDto } from '../dtos/update-article.dto';
import { VisitLog } from '../../../common/decorators/visit-log.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../../../modules/upload/services/upload/upload.service';
import { CategoryService } from '../services/category.service';
import { TagService } from '../services/tag.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { memoryStorage } from 'multer';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CommentService } from '../services/comment.service';
import { Response } from 'express';

// 前台文章控制器
@ApiTags('文章')
@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
    private readonly commentService: CommentService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.CREATE)
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Body('tagIds') tagIds: number[],
  ): Promise<ResultDto<Article>> {
    const article: Partial<Article> = {
      articleTitle: createArticleDto.title,
      articleContent: createArticleDto.content,
      articleDesc: createArticleDto.description,
      articleCover: createArticleDto.cover,
      categoryId: createArticleDto.categoryId,
      originalUrl: createArticleDto.originalUrl,
      isTop: createArticleDto.isTop ? 1 : 0,
      isDelete: 0,
      status: createArticleDto.isPublish ? 1 : 3, // 1-公开 3-草稿
    };

    const result = await this.articleService.create(article, tagIds);
    return ResultDto.success(result);
  }

  @ApiOperation({ summary: '查询文章列表' })
  @Get('list')
  @Public()
  async findAll(@Query() query: any): Promise<ResultDto<{ recordList: Article[]; count: number }>> {
    const { page = 1, limit = 10, keyword, categoryId, tagId, status } = query;
    const result = await this.articleService.findAll(
      +page,
      +limit,
      keyword,
      categoryId ? +categoryId : undefined,
      tagId ? +tagId : undefined,
      status !== undefined ? +status : undefined,
    );
    return ResultDto.success(result);
  }

  @ApiOperation({ summary: '查询文章详情' })
  @Get(':id')
  @Public()
  @VisitLog('文章详情')
  async findById(@Param('id') id: string): Promise<ResultDto<Article>> {
    const result = await this.articleService.findById(+id);
    return ResultDto.success(result);
  }

  @ApiOperation({ summary: '更新文章' })
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Body('tagIds') tagIds: number[],
  ): Promise<ResultDto<Article>> {
    const article: Partial<Article> = {
      articleTitle: updateArticleDto.title,
      articleContent: updateArticleDto.content,
      articleDesc: updateArticleDto.description,
      articleCover: updateArticleDto.cover,
      categoryId: updateArticleDto.categoryId,
      originalUrl: updateArticleDto.originalUrl,
      isTop: updateArticleDto.isTop ? 1 : 0,
      status: updateArticleDto.isPublish ? 1 : 3, // 1-公开 3-草稿
    };

    const result = await this.articleService.update(+id, article, tagIds);
    return ResultDto.success(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.DELETE)
  async remove(@Param('id') id: string): Promise<ResultDto<null>> {
    await this.articleService.remove(+id);
    return ResultDto.success(null);
  }
}

// 后台文章管理控制器
@ApiTags('后台文章管理')
@Controller('admin/article')
@UseGuards(JwtAuthGuard)
export class AdminArticleController {
  constructor(
    private readonly articleService: ArticleService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly commentService: CommentService,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    private readonly uploadService: UploadService,
  ) {}

  @Get('list')
  @ApiOperation({ summary: '查看后台文章列表' })
  async listArticleBackVO(
    @Query() query: any,
  ): Promise<ResultDto<{ recordList: Article[]; count: number }>> {
    const { page = 1, limit = 10, keyword, categoryId, tagId, status, isDelete } = query;
    const result = await this.articleService.findAll(
      +page,
      +limit,
      keyword,
      categoryId ? +categoryId : undefined,
      tagId ? +tagId : undefined,
      status !== undefined ? +status : undefined,
      isDelete !== undefined ? +isDelete : 0,
    );

    // 直接返回服务返回的格式
    return ResultDto.success(result as unknown as { recordList: Article[]; count: number });
  }

  @Post('add')
  @ApiOperation({ summary: '添加文章' })
  @OperationLog(OperationType.CREATE)
  async addArticle(@Body() articleData: any): Promise<ResultDto<Article>> {
    try {
      // 从前端接收的数据字段映射到后端DTO格式
      const createArticleDto: CreateArticleDto = {
        title: articleData.articleTitle,
        content: articleData.articleContent,
        description: articleData.articleDesc,
        cover: articleData.articleCover,
        categoryId: null, // 稍后根据categoryName获取
        isTop: articleData.isTop === 1,
        isPublish: articleData.status !== 3, // 如果status不是3(草稿)，则为发布状态
        isOriginal: articleData.articleType === 1,
        originalUrl: articleData.articleType !== 1 ? articleData.originalUrl : undefined,
      };

      // 1. 根据分类名称获取分类ID
      let categoryId = null;
      if (articleData.categoryName) {
        // 由于CategoryService没有直接通过名称查询的方法，我们直接使用Repository
        const existingCategory = await this.categoryRepository.findOne({
          where: { categoryName: articleData.categoryName },
        });

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // 如果分类不存在，创建新分类
          const newCategory = await this.categoryService.create({
            categoryName: articleData.categoryName,
          });
          categoryId = newCategory.id;
        }
        createArticleDto.categoryId = categoryId;
      }

      // 2. 根据标签名称列表获取标签ID列表
      let tagIds = [];
      if (articleData.tagNameList && articleData.tagNameList.length > 0) {
        // 查询数据库中已存在的标签
        for (const tagName of articleData.tagNameList) {
          // 查找或创建标签
          const tag = await this.tagService.findOrCreate(tagName);
          tagIds.push(tag.id);
        }
      }

      // 将原始数据转换为实体对象，只包含实际存在于数据库中的字段
      const article: Partial<Article> = {
        articleTitle: createArticleDto.title,
        articleContent: createArticleDto.content,
        articleDesc: createArticleDto.description || '',
        articleCover: createArticleDto.cover || '',
        categoryId: categoryId,
        articleType: articleData.articleType,
        isTop: createArticleDto.isTop ? 1 : 0,
        isRecommend: articleData.isRecommend,
        isDelete: 0,
        status: createArticleDto.isPublish ? 1 : 3, // 1-公开 3-草稿
        createTime: new Date(), // 显式设置创建时间
        userId: 1, // 设置默认用户ID，实际应从JWT中获取
      };

      // 创建文章
      const result = await this.articleService.create(article, tagIds);
      return ResultDto.success(result);
    } catch (error) {
      console.error('创建文章失败:', error);
      return ResultDto.error(`创建文章失败: ${error.message}`);
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除文章' })
  @OperationLog(OperationType.DELETE)
  async deleteArticle(@Body() articleIdList: number[]): Promise<ResultDto<null>> {
    await this.articleService.removeMultiple(articleIdList);
    return ResultDto.success(null);
  }

  @Put('recycle')
  @ApiOperation({ summary: '回收或恢复文章' })
  @OperationLog(OperationType.UPDATE)
  async updateArticleDelete(
    @Body() body: { id: number; isDelete: number },
  ): Promise<ResultDto<null>> {
    await this.articleService.updateIsDelete(body.id, body.isDelete);
    return ResultDto.success(null);
  }

  @Put('update')
  @ApiOperation({ summary: '修改文章' })
  @OperationLog(OperationType.UPDATE)
  async updateArticle(@Body() updateArticleDto: UpdateArticleDto, @Res() res: Response) {
    console.log('=========== 接收到更新请求 ===========');
    console.log('文章ID:', updateArticleDto.id);
    console.log('文章标题:', updateArticleDto.title);
    console.log('文章内容长度:', updateArticleDto.content?.length);
    console.log('文章内容预览:', updateArticleDto.content?.substring(0, 100) + '...');
    console.log('分类ID:', updateArticleDto.categoryId);
    console.log('标签名列表:', updateArticleDto.tagNameList);

    try {
      // 准备用于更新的文章数据
      const updateData: Partial<Article> = {
        id: updateArticleDto.id,
        articleTitle: updateArticleDto.title,
        articleContent: updateArticleDto.content,
        articleDesc: updateArticleDto.description,
        articleCover: updateArticleDto.cover,
        categoryId: updateArticleDto.categoryId,
        articleType: updateArticleDto.isOriginal ? 1 : 2, // 1-原创 2-转载
        isTop: updateArticleDto.isTop ? 1 : 0,
        isRecommend: 0, // 默认不推荐
        status: updateArticleDto.isPublish ? 1 : 3, // 1-公开 3-草稿
        updateTime: new Date(),
      };

      // 处理标签
      let tagIds = [];
      if (updateArticleDto.tagIds && Array.isArray(updateArticleDto.tagIds)) {
        tagIds = updateArticleDto.tagIds;
      } else if (updateArticleDto.tagNameList && Array.isArray(updateArticleDto.tagNameList)) {
        // 如果提供了标签名称列表，则查找或创建标签
        const tagPromises = updateArticleDto.tagNameList.map((tagName) =>
          this.tagService.findOrCreate(tagName),
        );
        const tags = await Promise.all(tagPromises);
        tagIds = tags.map((tag) => tag.id);
      }

      console.log('准备更新的标签IDs:', tagIds);
      console.log(
        '准备更新的文章数据:',
        JSON.stringify({
          ...updateData,
          articleContent: '(内容过长已省略)',
        }),
      );

      // 调用服务更新文章
      const updatedArticle = await this.articleService.update(updateData.id, updateData, tagIds);
      console.log('更新结果:', updatedArticle ? '成功' : '失败');

      return res.status(HttpStatus.OK).json({
        code: 200,
        message: '更新成功',
        data: updatedArticle,
      });
    } catch (error) {
      console.error('更新文章时出错:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 500,
        message: '更新失败: ' + error.message,
      });
    }
  }

  @Get('edit/:id')
  @ApiOperation({ summary: '编辑文章' })
  async editArticle(@Param('id') id: string): Promise<ResultDto<any>> {
    const article = await this.articleService.findById(+id);

    // 创建一个新对象以返回自定义结构
    const result = {
      ...article,
      // 添加tagNameList字段，只包含标签名称
      tagNameList: article.tags ? article.tags.map((tag) => tag.tagName) : [],
      categoryName: article.category ? article.category.categoryName : '',
    };

    return ResultDto.success(result);
  }

  @Put('top')
  @ApiOperation({ summary: '置顶文章' })
  @OperationLog(OperationType.UPDATE)
  async updateArticleTop(@Body() body: { id: number; isTop: number }): Promise<ResultDto<null>> {
    await this.articleService.updateIsTop(body.id, body.isTop);
    return ResultDto.success(null);
  }

  @Put('recommend')
  @ApiOperation({ summary: '推荐文章' })
  @OperationLog(OperationType.UPDATE)
  async updateArticleRecommend(
    @Body() body: { id: number; isRecommend: number },
  ): Promise<ResultDto<null>> {
    await this.articleService.updateIsRecommend(body.id, body.isRecommend);
    return ResultDto.success(null);
  }

  @Post('upload')
  @ApiOperation({ summary: '上传文章图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片文件',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
      },
      storage: memoryStorage(), // 明确使用内存存储
    }),
  )
  async uploadArticleImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return ResultDto.error('请选择要上传的图片');
    }

    // 检查文件格式
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return ResultDto.error('只允许上传jpg, png, gif, webp格式的图片');
    }

    try {
      const result = await this.uploadService.uploadFile(file, 'article');
      return ResultDto.success(result.url);
    } catch (error) {
      return ResultDto.error('上传失败: ' + error.message);
    }
  }
}
