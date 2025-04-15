import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ArticleService } from '../services/article.service';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Article } from '../entities/article.entity';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { CreateArticleDto } from '../dtos/create-article.dto';
import { UpdateArticleDto } from '../dtos/update-article.dto';
import { VisitLog } from '../../../common/decorators/visit-log.decorator';

@ApiTags('文章管理')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @ApiOperation({ summary: '创建文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.CREATE)
  create(@Body() createArticleDto: CreateArticleDto, @Body('tagIds') tagIds: number[]) {
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

    return this.articleService.create(article, tagIds);
  }

  @ApiOperation({ summary: '查询文章列表' })
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: any) {
    const { page = 1, limit = 10, ...rest } = query;
    return this.articleService.findAll(+page, +limit, rest);
  }

  @ApiOperation({ summary: '查询文章详情' })
  @Get(':id')
  @VisitLog('文章详情')
  findById(@Param('id') id: string) {
    return this.articleService.findById(+id);
  }

  @ApiOperation({ summary: '更新文章' })
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Body('tagIds') tagIds: number[],
  ) {
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

    return this.articleService.update(+id, article, tagIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<ResultDto<null>> {
    await this.articleService.remove(id);
    return ResultDto.success(null);
  }
}
