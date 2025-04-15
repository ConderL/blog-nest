import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController, AdminUserController } from './user.controller';
import { User } from './entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { Menu } from './entities/menu.entity';
import { RoleMenu } from './entities/role-menu.entity';
import { RoleService } from './services/role.service';
import { MenuService } from './services/menu.service';
import { RoleController } from './controllers/role.controller';
import { MenuController } from './controllers/menu.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserRole, Menu, RoleMenu]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController, RoleController, MenuController, AdminUserController],
  providers: [UserService, RoleService, MenuService],
  exports: [UserService, RoleService, MenuService],
})
export class UserModule {}
