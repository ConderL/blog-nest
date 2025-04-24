import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitLog } from './entities/visit-log.entity';
import { OperationLog } from './entities/operation-log.entity';
import { ExceptionLog } from './entities/exception-log.entity';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { AdminExceptionLogController } from './controllers/admin-exception-log.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([VisitLog, OperationLog, ExceptionLog]), UserModule],
  controllers: [LogController, AdminExceptionLogController],
  providers: [LogService],
  exports: [LogService, TypeOrmModule.forFeature([VisitLog, OperationLog, ExceptionLog])],
})
export class LogModule {}
