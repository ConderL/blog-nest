import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ArticleService } from '../services/article.service';
import { Article } from '../entities/article.entity';

@ApiTags('文章管理')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @ApiOperation({ summary: '创建文章' })
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() articleData: { article: Partial<Article>; tagIds: number[] },
    @Request() req,
  ): Promise<Article> {
    const { article, tagIds } = articleData;
    article.userId = req.user.id;
    return this.articleService.create(article, tagIds);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: number,
    @Body() articleData: { article: Partial<Article>; tagIds: number[] },
  ): Promise<Article> {
    const { article, tagIds } = articleData;
    return this.articleService.update(id, article, tagIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.articleService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取文章列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tagId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: number,
    @Query('tagId') tagId?: number,
    @Query('status') status?: number,
  ): Promise<{ items: Article[]; total: number }> {
    return this.articleService.findAll(page, limit, keyword, categoryId, tagId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情' })
  async findOne(@Param('id') id: number): Promise<Article> {
    return this.articleService.findById(id);
  }
}
