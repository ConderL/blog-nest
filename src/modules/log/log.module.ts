import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitLog } from './entities/visit-log.entity';
import { OperationLog } from './entities/operation-log.entity';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([VisitLog, OperationLog]), UserModule],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
