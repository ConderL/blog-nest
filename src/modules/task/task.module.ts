import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../blog/entities/article.entity';
import { VisitLog } from '../blog/entities/visit-log.entity';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Article, VisitLog])],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
