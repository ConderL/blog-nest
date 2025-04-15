import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../user/dto/login.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { ResultDto } from '../../common/dtos/result.dto';
import { Logger } from '@nestjs/common';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}

@ApiTags('管理员认证')
@Controller('admin/auth')
export class AdminAuthController {
  private readonly logger = new Logger(AdminAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ResultDto<any>> {
    this.logger.log(`管理员登录请求: ${loginDto.username}`);
    const result = await this.authService.adminLogin(loginDto);

    // 确保返回的token是一个字符串
    if (result.flag && typeof result.data === 'string') {
      this.logger.log(`管理员登录成功: ${loginDto.username}, token长度: ${result.data.length}`);
    } else {
      this.logger.warn(`管理员登录失败或token格式不正确: ${result.msg}`);
    }

    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: '管理员退出登录' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.authService.logout();
  }
}
