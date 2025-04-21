import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlatformType } from 'src/modules/captcha/dto/captcha.dto';

export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  password: string;

  @ApiProperty({
    description: '验证码',
    example: 'abcd',
  })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须是字符串' })
  code: string;

  @ApiProperty({
    description: '验证码UUID',
    example: 'a1b2c3d4e5f6',
  })
  @IsNotEmpty({ message: '验证码UUID不能为空' })
  @IsString({ message: '验证码UUID必须是字符串' })
  captchaUUID: string;

  @ApiProperty({
    description: '平台类型',
    example: 'ConderAdmin',
    enum: PlatformType,
  })
  @IsNotEmpty({ message: '平台类型不能为空' })
  @IsEnum(PlatformType, { message: '平台类型无效' })
  type: PlatformType;
}
