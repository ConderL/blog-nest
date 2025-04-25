import { Module } from '@nestjs/common';
import { OauthService } from './services/oauth/oauth.service';
import { OauthController } from './controllers/oauth/oauth.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OauthUserEntity } from './entities/oauth-user.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([OauthUserEntity]),
    JwtModule.register({}),
    UserModule,
  ],
  providers: [OauthService],
  controllers: [OauthController],
  exports: [OauthService],
})
export class OauthModule {}
