import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from '../user/dto/login.dto';
import { ResultDto } from '../../common/dtos/result.dto';
import * as bcrypt from 'bcryptjs';
import * as forge from 'node-forge';

// 解密密码的辅助函数
function decryptPassword(encryptedPassword: string): string {
  try {
    console.log('尝试解密密码，长度:', encryptedPassword.length);

    // 去除可能存在的前缀
    if (encryptedPassword.startsWith('-----BEGIN')) {
      console.log('检测到PEM格式，去除前缀');
      encryptedPassword = encryptedPassword.replace(/^-----BEGIN.*-----/, '').trim();
      encryptedPassword = encryptedPassword.replace(/-----END.*-----$/, '').trim();
    }

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

    try {
      console.log('尝试解析私钥...');
      const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
      console.log('私钥解析成功');

      try {
        console.log('尝试Base64解码密文...');
        const encryptedBytes = forge.util.decode64(encryptedPassword);
        console.log('Base64解码成功，数据长度:', encryptedBytes.length);

        console.log('尝试RSA解密...');
        const decrypted = privateKeyObj.decrypt(encryptedBytes);
        console.log('RSA解密成功，明文长度:', decrypted.length);

        return decrypted;
      } catch (decodeError) {
        console.error('Base64解码或RSA解密失败:', decodeError);
        throw new Error('密码格式错误，无法解密');
      }
    } catch (keyError) {
      console.error('私钥解析失败:', keyError);
      throw new Error('服务器密钥配置错误');
    }
  } catch (error) {
    console.error('解密密码失败:', error);
    throw new Error('解密密码失败: ' + error.message);
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, encryptedPassword: string): Promise<any> {
    this.logger.log(`尝试验证用户: ${username}`);

    const user = await this.userService.findByUsername(username);
    if (!user) {
      this.logger.warn(`用户名不存在: ${username}`);
      throw new UnauthorizedException('用户名不存在');
    }

    this.logger.log(`找到用户: ${username}, ID: ${user.id}`);

    try {
      try {
        // 尝试解密前端加密的密码
        this.logger.log('尝试解密密码...');
        const decryptedPassword = decryptPassword(encryptedPassword);
        this.logger.log(`密码解密成功，长度: ${decryptedPassword.length}`);

        // 使用bcrypt比较解密后的密码和数据库中的哈希密码
        const isPasswordValid = await bcrypt.compare(decryptedPassword, user.password);
        if (isPasswordValid) {
          this.logger.log('密码验证成功');
          // 移除密码字段，返回用户信息
          const { password, ...result } = user;
          return result;
        } else {
          this.logger.warn('密码不匹配');
          throw new UnauthorizedException('密码错误');
        }
      } catch (decryptError) {
        this.logger.error(`密码解密失败: ${decryptError.message}`);

        // 尝试直接验证明文密码
        this.logger.log('尝试直接比较明文密码...');
        const isDirectPasswordValid = await bcrypt.compare(encryptedPassword, user.password);
        if (isDirectPasswordValid) {
          this.logger.log('明文密码验证成功');
          // 移除密码字段，返回用户信息
          const { password, ...result } = user;
          return result;
        }

        this.logger.warn('密码验证失败');
        throw new UnauthorizedException('密码错误');
      }
    } catch (error) {
      this.logger.error(`验证过程发生错误: ${error.message}`);
      throw new UnauthorizedException('验证密码失败');
    }
  }

  async login(loginDto: LoginDto): Promise<ResultDto<any>> {
    try {
      const user = await this.validateUser(loginDto.username, loginDto.password);

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

  /**
   * 获取用户个人资料
   */
  async getProfile(userId: number): Promise<ResultDto<any>> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        return ResultDto.fail('用户不存在');
      }

      // 获取用户角色
      const roleList = await this.userService.getUserRoles(userId);

      // 获取用户权限列表
      const permissionList = await this.userService.getUserPermissions(userId);

      // 组装用户信息
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
        email: user.email || '',
        roleList,
        permissionList,
      };

      return ResultDto.success(userInfo);
    } catch (error) {
      return ResultDto.fail(error.message, error.status || 400);
    }
  }

  /**
   * 管理员登录
   */
  async adminLogin(loginDto: LoginDto): Promise<ResultDto<any>> {
    this.logger.log(`管理员登录请求: ${loginDto.username}`);
    try {
      const user = await this.validateUser(loginDto.username, loginDto.password);
      this.logger.log(`用户验证成功: ${user.username}`);

      // 获取用户角色
      const roleList = await this.userService.getUserRoles(user.id);
      this.logger.log(`获取到用户角色: ${JSON.stringify(roleList.map((r) => r.roleLabel))}`);

      // 如果roleList为空，且用户名为admin，则默认添加管理员角色
      if (roleList.length === 0 && user.username === 'admin') {
        this.logger.log('用户没有角色，但用户名为admin，添加默认管理员角色');
        // 这里我们只模拟返回一个管理员角色，实际不写入数据库
        roleList.push({
          id: '1',
          roleName: '管理员',
          roleLabel: 'admin',
          remark: '系统管理员',
          isDisable: 0,
          createTime: new Date(),
          updateTime: new Date(),
        } as any);
      }

      // 获取用户权限列表
      const permissionList = await this.userService.getUserPermissions(user.id);
      this.logger.log(`获取到用户权限: ${JSON.stringify(permissionList)}`);

      // 如果permissionList为空，且用户名为admin，则添加所有权限
      if ((permissionList.length === 0 || !permissionList) && user.username === 'admin') {
        this.logger.log('用户没有权限，但用户名为admin，添加所有权限');
        // 添加常用权限
        const allPermissions = [
          'system:user:list',
          'system:user:add',
          'system:user:update',
          'system:user:delete',
          'system:user:status',
          'system:role:list',
          'system:role:add',
          'system:role:update',
          'system:role:delete',
          'system:role:status',
          'system:menu:list',
          'system:menu:add',
          'system:menu:update',
          'system:menu:delete',
          'monitor:online:list',
          'monitor:online:kick',
          'article:list',
          'article:add',
          'article:update',
          'article:delete',
          'article:status',
          'category:list',
          'category:add',
          'category:update',
          'category:delete',
          'tag:list',
          'tag:add',
          'tag:update',
          'tag:delete',
        ];
        allPermissions.forEach((p) => permissionList.push(p));
      }

      // 获取用户菜单树
      const menuList = await this.userService.getUserMenuTree(user.id);
      this.logger.log(`获取到用户菜单树，根节点数量: ${menuList.length}`);

      // 生成JWT令牌
      const payload = { username: user.username, sub: user.id };
      const token = this.jwtService.sign(payload);
      this.logger.log(`生成JWT令牌: ${token.substring(0, 20)}...，长度: ${token.length}`);

      // 组装用户信息
      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
        roleList: roleList.map((role) => role.roleLabel || role.id),
        permissionList: permissionList,
        menuList: menuList,
        token: token,
      };

      this.logger.log(`管理员登录成功: ${user.username}`);
      return ResultDto.success(userInfo); // 返回完整的用户信息，包括token
    } catch (error) {
      this.logger.error(`管理员登录失败: ${error.message}`);
      return ResultDto.fail(error.message, error.status || 400);
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<ResultDto<null>> {
    this.logger.log('用户登出');
    // NestJS的JWT实现是无状态的，前端删除token即可
    // 这里可以根据需要实现黑名单或额外的登出逻辑
    return ResultDto.success(null, '退出成功');
  }
}
