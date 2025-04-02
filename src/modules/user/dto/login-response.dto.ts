import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '用户名', example: 'admin' })
  username: string;

  @ApiProperty({ description: '昵称', example: '管理员' })
  nickname: string;

  @ApiProperty({
    description: '头像',
    example: 'https://example.com/avatar.jpg',
  })
  avatar: string;

  @ApiProperty({ description: '邮箱', example: 'admin@example.com' })
  email: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({ description: '用户信息' })
  userInfo: UserInfoDto;
}
