import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadModule } from '../upload/upload.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UserModule } from '../user/user.module';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { IpService } from '../../services/ip.service';

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
import { Carousel } from './entities/carousel.entity';
import { UploadFileEntity } from '../upload/entities/file.entity';
import { Message } from './entities/message.entity';
import { Talk } from './entities/talk.entity';

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
import { CarouselService } from './services/carousel.service';
import { MessageService } from './services/message.service';
import { TalkService } from './services/talk.service';

// 控制器
import {
  ArticleController,
  AdminArticleController,
  ArchivesController,
} from './controllers/article.controller';
import {
  CategoryController,
  AdminCategoryController,
  CategorieController,
} from './controllers/category.controller';
import { TagController, AdminTagController } from './controllers/tag.controller';
import { CommentController } from './controllers/comment.controller';
import { AdminCommentController } from './controllers/admin-comment.controller';
import { FileController } from './controllers/file.controller';
import { FriendController } from './controllers/friend.controller';
import {
  SiteConfigController,
  AdminSiteConfigController,
} from './controllers/site-config.controller';
import { VisitLogController } from './controllers/visit-log.controller';
import { SearchController } from './controllers/search.controller';
import { BlogInfoController } from './controllers/blog-info.controller';
import { CarouselController, AdminCarouselController } from './controllers/carousel.controller';
import { CommentReplyController } from './controllers/comment-reply.controller';
import { MessageController } from './controllers/message.controller';
import { AdminMessageController } from './controllers/admin-message.controller';
import { AdminTalkController, TalkController } from './controllers/admin-talk.controller';

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
      Carousel,
      UploadFileEntity,
      Message,
      Talk,
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
    UserModule,
    HttpModule,
  ],
  controllers: [
    ArticleController,
    AdminArticleController,
    ArchivesController,
    CategoryController,
    CategorieController,
    AdminCategoryController,
    TagController,
    AdminTagController,
    CommentController,
    AdminCommentController,
    CommentReplyController,
    FileController,
    FriendController,
    SiteConfigController,
    AdminSiteConfigController,
    VisitLogController,
    SearchController,
    BlogInfoController,
    CarouselController,
    AdminCarouselController,
    MessageController,
    AdminMessageController,
    AdminTalkController,
    TalkController,
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
    CarouselService,
    VisitLogInterceptor,
    MessageService,
    TalkService,
    {
      provide: IpService,
      useFactory: (httpService: HttpService, configService: ConfigService) => {
        return new IpService(httpService, configService);
      },
      inject: [HttpService, ConfigService],
    },
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
    CarouselService,
    VisitLogInterceptor,
    MessageService,
    TalkService,
    IpService,
  ],
})
export class BlogModule {}
