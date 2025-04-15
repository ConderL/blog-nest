import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { ResultDto } from '../../common/dtos/result.dto';
import * as bcrypt from 'bcryptjs';
import * as forge from 'node-forge';

// 解密密码的辅助函数
function decryptPassword(encryptedPassword: string): string {
  try {
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCJm2pG0B4kTqrP
PaNvKUWujJGFguj4IqQQ8Vlm83tv0PRuAm9QPGiO1dWLDpyo9qP7s501scOAkysY
tcX1iVKl5ArlDcwVfKUH9GLeuMJ1ZvEHRLPshBUxiIhjKds6pzX1oko8N8MZ1qxY
GAr0+p80RJMBMXJklVcxQO/sqMLbsbbmIXl/cp4ZqGE0rT2XL65d4miHL3+vhKp0
1YnNZpEhC8FYB6sLXXwb8LPR7QaNrtrbQrnijFRmJe/lFw9m7GabigBKgDIIFCOY
ro4cH4z64fo7YzzBW7essIe3XXFsogzY9aZr60O24vCJYvRp79SBF3yqA6fOUmxB
ln4/QSlDAgMBAAECggEADBGpfJR8UErmCE8rqnBAQFLr4H3e2QSQxzujz7fDN8dn
6M4l3S+vK/ftRsj9TIR1VXona7Ivp3NA8GXg+uwUZ6BcpEJVh/zqrIvusAIcbBef
RDfuX+wlv7Zt3+Sn6bkIroaRZD6vyfBeJUvWii4BEKCDFDO2CMRgZV2ArY0Pqh0H
NP1JMIQoo/Kw+wJ26HdK0J2Q443bueUJPeJUFe0L8nQOoRvfXEtIENiUBM2tWZnz
F1jTOMJfkGmQEjt1q29nh+ybsWdJzlsK7FghMgMrtEPFr7UToaB+cuu4DCCfzJHf
AhUgm4BVkCLXYRkEK2feOUs7IoQwXVYNOsAk2GahgQKBgQC8+TFVyF/NJHUsP0zr
/CH/Yq7ALoSC5ICs2gDDHNOkxkHY0bUTxanWTR0oB6nSvTGL+RDxTYlT2TkyZt9C
mFTdzzbTRysB4R0f09w427eqFrevQ11z2FtA/dvzxBzkXsNrHky5bpc1MUD1odZO
cfACBaLTpew5RGVuVJicHZrL8wKBgQC6aief+5nNNkEPpk2HGRW7dK6xBpjZLJt0
qAiHnRryE+KfboRzopPr0JRDwaLFwCGH1V8Y2088SNJaRfGdHMBgY2OVI/q5QO/U
8WapmUkrERUBmDvLGw5bGI3mFW1FB2HEpf0SBDv1j2m05QmnBNMIxBNfLzvS8mQ8
xs6DgpYRcQKBgQCfqEIAYdxe67B7g7evoUPwCyXthN+73ubAIyeFsTM3AbHcR8Ef
RV8qidhaW68lN2dHBVVFKeceimaCqNtz3lPFWy7M7lHtso3yuAJVn3zbHXpvfxDT
sTXYASL2HvjyEQY12FGmUUM7U7O4U9VGTYkjjDN3cbXU5G51+s89Bt4j9QKBgBf7
8H008eTlRhmtW+w13gXwTUmZf7DxfE7WD8LjA8SBqna40XHPSRjeDTVqhHbM8YN4
gHPCQ7+N3wKeXSfJuzarkvRtXKTZJgJPzNWlUzSnTfyWiZroMECoOBmSSCzJdlrG
wHjA8rX1bbRIg6VpiX1nPNbSTPAnH55yNb/V3VkBAoGAEj+FZygwc41q1HmJP26Y
kYC8adVwIn1bhUiHSjCnOXZ+Det6A2iGV8ntUzQcCvl1y/46YorcrRBIJf5BkZJH
9UR7qh8djOwO5n5mUFIsxLpkmEnrFUAXfJyiQP5lPdfKDkVyBwFdMM3bZB+n7owT
sCAPWVZEH+1PQBg4FdlPiqU=
-----END PRIVATE KEY-----`;

    // 创建私钥
    const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);

    // Base64解码
    const encryptedBytes = forge.util.decode64(encryptedPassword);

    // 解密
    const decrypted = privateKeyObj.decrypt(encryptedBytes);

    return decrypted;
  } catch (error) {
    console.error('解密密码失败:', error);
    throw new Error('解密密码失败');
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, encryptedPassword: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名不存在');
    }

    try {
      // 解密前端加密的密码
      const decryptedPassword = decryptPassword(encryptedPassword);
      console.log('解密后的密码:', decryptedPassword);

      // 使用bcrypt比较解密后的密码和数据库中的哈希密码
      const isPasswordValid = await bcrypt.compare(decryptedPassword, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('密码错误');
      }

      // 移除密码字段，返回用户信息
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error('验证密码失败:', error);
      throw new UnauthorizedException('验证密码失败');
    }
  }

  async login(loginDto: LoginDto): Promise<ResultDto<any>> {
    try {
      const user = await this.validateUser(loginDto.username, loginDto.password);

      if (user.status !== 1) {
        throw new UnauthorizedException('账号已被禁用');
      }

      const payload = { username: user.username, sub: user.id };
      const token = this.jwtService.sign(payload);

      // 获取用户角色
      const roleList = await this.userService.getUserRoles(user.id);

      // 获取用户权限列表
      const permissionList = await this.userService.getUserPermissions(user.id);

      // 组装用户信息
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
        email: user.email || '',
        roleList,
        permissionList,
        token,
      };

      // 返回用户信息和token
      return ResultDto.success(userInfo);
    } catch (error) {
      return ResultDto.fail(error.message, error.status || 400);
    }
  }
}
