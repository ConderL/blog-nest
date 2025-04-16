import { Module } from '@nestjs/common';
import { OauthService } from './services/oauth/oauth.service';
import { OauthController } from './controllers/oauth/oauth.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [OauthService],
  controllers: [OauthController],
  exports: [OauthService],
})
export class OauthModule {}
