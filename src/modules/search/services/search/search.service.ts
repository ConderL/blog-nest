import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from '../../../blog/entities/article.entity';
import { Client } from '@elastic/elasticsearch';

/**
 * 搜索服务
 */
@Injectable()
export class SearchService {
  private elasticsearchClient: Client;
  private searchMode: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {
    // 初始化搜索模式
    this.searchMode = this.configService.get('search.mode', 'mysql');

    // 如果使用 Elasticsearch，则初始化 ES 客户端
    if (this.searchMode === 'elasticsearch') {
      this.initElasticsearchClient();
    }
  }

  /**
   * 初始化 Elasticsearch 客户端
   */
  private initElasticsearchClient() {
    const config = this.configService.get('search.elasticsearch');
    this.elasticsearchClient = new Client({
      node: `${config.scheme}://${config.hostname}:${config.port}`,
      auth: {
        username: config.username,
        password: config.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * 文章搜索
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 搜索结果
   */
  async searchArticles(
    keyword: string,
    page = 1,
    pageSize = 10,
  ): Promise<{ items: any[]; total: number }> {
    if (this.searchMode === 'elasticsearch') {
      return this.searchArticlesWithES(keyword, page, pageSize);
    } else {
      return this.searchArticlesWithMySQL(keyword, page, pageSize);
    }
  }

  /**
   * 使用 MySQL 搜索文章
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   */
  private async searchArticlesWithMySQL(
    keyword: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: Article[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const whereCondition = [
      { articleTitle: Like(`%${keyword}%`), isDelete: 0, status: 1 },
      { articleContent: Like(`%${keyword}%`), isDelete: 0, status: 1 },
      { articleDesc: Like(`%${keyword}%`), isDelete: 0, status: 1 },
    ];

    // 查询符合条件的文章总数
    const total = await this.articleRepository.count({
      where: whereCondition,
    });

    // 查询文章列表
    const items = await this.articleRepository.find({
      where: whereCondition,
      skip,
      take: pageSize,
      order: {
        createdAt: 'DESC',
      },
      relations: ['category', 'tags'],
    });

    return { items, total };
  }

  /**
   * 使用 Elasticsearch 搜索文章
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   */
  private async searchArticlesWithES(
    keyword: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: any[]; total: number }> {
    try {
      // 从 ES 中搜索
      const from = (page - 1) * pageSize;
      const response = await this.elasticsearchClient.search({
        index: 'articles',
        from,
        size: pageSize,
        query: {
          bool: {
            should: [
              { match: { articleTitle: keyword } },
              { match: { articleContent: keyword } },
              { match: { articleDesc: keyword } },
            ],
            filter: [{ term: { isDelete: 0 } }, { term: { status: 1 } }],
          },
        },
        highlight: {
          fields: {
            articleTitle: {},
            articleContent: {},
            articleDesc: {},
          },
          pre_tags: ['<em class="highlight">'],
          post_tags: ['</em>'],
        },
        sort: [{ createdAt: { order: 'desc' } }],
      });

      // 提取结果
      const hits = response.hits.hits;
      const total = response.hits.total.value || 0;

      // 格式化结果
      const items = hits.map((hit) => {
        const source = hit._source;
        const highlight = hit.highlight || {};

        return {
          ...source,
          id: hit._id,
          articleTitle: highlight.articleTitle ? highlight.articleTitle[0] : source.articleTitle,
          articleDesc: highlight.articleDesc ? highlight.articleDesc[0] : source.articleDesc,
          highlight: highlight.articleContent ? highlight.articleContent.join('...') : '',
        };
      });

      return { items, total };
    } catch (error) {
      console.error('Elasticsearch搜索失败:', error);
      // 如果ES搜索失败，退回到MySQL搜索
      return this.searchArticlesWithMySQL(keyword, page, pageSize);
    }
  }

  /**
   * 将文章同步到 Elasticsearch
   * @param article 文章对象
   */
  async syncArticleToES(article: Article): Promise<void> {
    if (this.searchMode !== 'elasticsearch') {
      return;
    }

    try {
      // 将文章转换为普通对象
      const articleObj = {
        ...article,
        // 去除不需要索引的字段
        tags: undefined,
        category: undefined,
      };

      await this.elasticsearchClient.index({
        index: 'articles',
        id: article.id.toString(),
        document: articleObj,
      });
    } catch (error) {
      console.error('同步文章到ES失败:', error);
    }
  }

  /**
   * 从 Elasticsearch 删除文章
   * @param articleId 文章ID
   */
  async removeArticleFromES(articleId: number): Promise<void> {
    if (this.searchMode !== 'elasticsearch') {
      return;
    }

    try {
      await this.elasticsearchClient.delete({
        index: 'articles',
        id: articleId.toString(),
      });
    } catch (error) {
      console.error('从ES删除文章失败:', error);
    }
  }
}
