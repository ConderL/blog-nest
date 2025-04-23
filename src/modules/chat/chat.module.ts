import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './services/chat.service';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatController } from './controllers/chat.controller';
import { HttpModule, HttpService } from '@nestjs/axios';
import { IpService } from '../../services/ip.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ToolsModule } from '../tools/tools.module';

/**
 * 聊天模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage]), HttpModule, ConfigModule, ToolsModule],
  providers: [
    ChatService,
    ChatGateway,
    {
      provide: IpService,
      useFactory: (httpService: HttpService, configService: ConfigService) => {
        return new IpService(httpService, configService);
      },
      inject: [HttpService, ConfigService],
    },
  ],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
