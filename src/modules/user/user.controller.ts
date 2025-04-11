import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() user: Partial<User>) {
    return this.userService.update(id, user);
  }

  @Post('register')
  async register(@Body() user: Partial<User>) {
    console.log(user);
    try {
      return await this.userService.create(user);
    } catch (error) {
      console.error('注册错误:', error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: '注册失败，请检查输入信息或稍后重试',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名和密码登录系统',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '登录失败，用户名或密码错误',
  })
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.userService.login(loginDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }
}
