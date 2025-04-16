import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchService } from '../../services/search/search.service';

@ApiTags('搜索')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 搜索文章
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   */
  @Get('articles')
  @ApiOperation({ summary: '搜索文章' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: '搜索成功' })
  async searchArticles(
    @Query('keyword') keyword: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    if (!keyword) {
      return {
        code: 400,
        message: '搜索关键词不能为空',
        data: null,
      };
    }

    try {
      const { items, total } = await this.searchService.searchArticles(keyword, +page, +pageSize);

      return {
        code: 200,
        message: '搜索成功',
        data: {
          items,
          total,
          page: +page,
          pageSize: +pageSize,
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: '搜索失败: ' + error.message,
        data: null,
      };
    }
  }
}
