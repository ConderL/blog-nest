import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BaiduTextCensorService } from './services/baidu-text-censor/baidu-text-censor.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [BaiduTextCensorService],
  exports: [BaiduTextCensorService],
})
export class ToolsModule {}
