import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadModule } from '../upload/upload.module';
import { CacheModule } from '@nestjs/cache-manager';

// 实体
import { Article } from './entities/article.entity';
import { Category } from './entities/category.entity';
import { Tag } from './entities/tag.entity';
import { Comment } from './entities/comment.entity';
import { ArticleTag } from './entities/article-tag.entity';
import { BlogFile } from './entities/blog-file.entity';
import { Friend } from './entities/friend.entity';
import { SiteConfig } from './entities/site-config.entity';
import { VisitLog } from './entities/visit-log.entity';
import { User } from '../user/entities/user.entity';

// 服务
import { ArticleService } from './services/article.service';
import { CategoryService } from './services/category.service';
import { TagService } from './services/tag.service';
import { CommentService } from './services/comment.service';
import { FileService } from './services/file.service';
import { FriendService } from './services/friend.service';
import { SiteConfigService } from './services/site-config.service';
import { VisitLogService } from './services/visit-log.service';
import { SearchService } from './services/search.service';
import { BlogInfoService } from './services/blog-info.service';

// 控制器
import { ArticleController, AdminArticleController } from './controllers/article.controller';
import { CategoryController, AdminCategoryController } from './controllers/category.controller';
import { TagController, AdminTagController } from './controllers/tag.controller';
import { CommentController } from './controllers/comment.controller';
import { FileController } from './controllers/file.controller';
import { FriendController } from './controllers/friend.controller';
import {
  SiteConfigController,
  AdminSiteConfigController,
} from './controllers/site-config.controller';
import { VisitLogController } from './controllers/visit-log.controller';
import { SearchController } from './controllers/search.controller';
import { BlogInfoController } from './controllers/blog-info.controller';

// 拦截器
import { VisitLogInterceptor } from '../../common/interceptors/visit-log.interceptor';

/**
 * 博客模块
 * 包含博客信息和访问日志相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      Category,
      Tag,
      Comment,
      ArticleTag,
      BlogFile,
      Friend,
      SiteConfig,
      VisitLog,
      User,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, callback) => {
          const timestamp = new Date().getTime();
          const random = Math.floor(Math.random() * 10000);
          const ext = extname(file.originalname);
          callback(null, `${timestamp}_${random}${ext}`);
        },
      }),
    }),
    CacheModule.register(),
    UploadModule,
  ],
  controllers: [
    ArticleController,
    AdminArticleController,
    CategoryController,
    AdminCategoryController,
    TagController,
    AdminTagController,
    CommentController,
    FileController,
    FriendController,
    SiteConfigController,
    AdminSiteConfigController,
    VisitLogController,
    SearchController,
    BlogInfoController,
  ],
  providers: [
    ArticleService,
    CategoryService,
    TagService,
    CommentService,
    FileService,
    FriendService,
    SiteConfigService,
    VisitLogService,
    SearchService,
    BlogInfoService,
    VisitLogInterceptor,
  ],
  exports: [
    ArticleService,
    CategoryService,
    TagService,
    CommentService,
    FileService,
    FriendService,
    SiteConfigService,
    VisitLogService,
    SearchService,
    BlogInfoService,
    VisitLogInterceptor,
  ],
})
export class BlogModule {}
