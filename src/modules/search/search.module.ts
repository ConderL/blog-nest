import { Module } from '@nestjs/common';
import { SearchService } from './services/search/search.service';
import { SearchController } from './controllers/search/search.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../blog/entities/article.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Article])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
