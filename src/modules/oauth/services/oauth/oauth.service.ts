import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as qs from 'qs';
import { OauthUserDto, OauthResultDto } from '../../dto/oauth-user.dto';
import { OauthUserEntity } from '../../entities/oauth-user.entity';
import { UserService } from '../../../user/user.service';
import { JwtService } from '@nestjs/jwt';

/**
 * 第三方登录服务
 */
@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(OauthUserEntity)
    private oauthUserRepository: Repository<OauthUserEntity>,
  ) {}

  /**
   * 获取GitHub登录地址
   */
  getGithubAuthUrl(): string {
    const clientId = this.configService.get('oauth.github.clientId');
    const redirectUrl = this.configService.get('oauth.github.redirectUrl');
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=user`;
  }

  /**
   * 处理GitHub回调
   * @param code 授权码
   * @returns 用户信息
   */
  async handleGithubCallback(code: string): Promise<OauthResultDto> {
    try {
      // 1. 获取 access_token
      const tokenResponse = await axios.post(
        this.configService.get('oauth.github.accessTokenUrl'),
        {
          client_id: this.configService.get('oauth.github.clientId'),
          client_secret: this.configService.get('oauth.github.clientSecret'),
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const { access_token } = tokenResponse.data;

      if (!access_token) {
        throw new Error('GitHub授权失败，无法获取访问令牌');
      }

      // 2. 获取用户信息
      const userResponse = await axios.get(this.configService.get('oauth.github.userInfoUrl'), {
        headers: {
          Authorization: `token ${access_token}`,
        },
      });

      const githubUser = {
        sourceId: String(userResponse.data.id),
        username: userResponse.data.login,
        nickname: userResponse.data.name || userResponse.data.login,
        avatar: userResponse.data.avatar_url,
        email: userResponse.data.email || '',
        loginType: 4, // Github
        accessToken: access_token,
      };

      // 3. 登录或注册
      return await this.loginOrRegister(githubUser);
    } catch (error) {
      this.logger.error('GitHub授权失败', error);
      return {
        success: false,
        message: 'GitHub授权失败: ' + error.message,
      };
    }
  }

  /**
   * 获取Gitee登录地址
   */
  getGiteeAuthUrl(): string {
    const clientId = this.configService.get('oauth.gitee.clientId');
    const redirectUrl = this.configService.get('oauth.gitee.redirectUrl');
    return `https://gitee.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code`;
  }

  /**
   * 处理Gitee回调
   * @param code 授权码
   * @returns 用户信息
   */
  async handleGiteeCallback(code: string): Promise<OauthResultDto> {
    try {
      // 1. 获取 access_token
      const tokenResponse = await axios.post(
        this.configService.get('oauth.gitee.accessTokenUrl'),
        qs.stringify({
          client_id: this.configService.get('oauth.gitee.clientId'),
          client_secret: this.configService.get('oauth.gitee.clientSecret'),
          code,
          redirect_uri: this.configService.get('oauth.gitee.redirectUrl'),
          grant_type: this.configService.get('oauth.gitee.grantType'),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token } = tokenResponse.data;

      if (!access_token) {
        throw new Error('Gitee授权失败，无法获取访问令牌');
      }

      // 2. 获取用户信息
      const userInfoUrl = this.configService
        .get('oauth.gitee.userInfoUrl')
        .replace('{access_token}', access_token);
      const userResponse = await axios.get(userInfoUrl);

      const giteeUser = {
        sourceId: String(userResponse.data.id),
        username: userResponse.data.login,
        nickname: userResponse.data.name || userResponse.data.login,
        avatar: userResponse.data.avatar_url,
        email: userResponse.data.email || '',
        loginType: 3, // Gitee
        accessToken: access_token,
      };

      // 3. 登录或注册
      return await this.loginOrRegister(giteeUser);
    } catch (error) {
      this.logger.error('Gitee授权失败', error);
      return {
        success: false,
        message: 'Gitee授权失败: ' + error.message,
      };
    }
  }

  /**
   * 获取QQ登录地址
   */
  getQQAuthUrl(): string {
    const appId = this.configService.get('oauth.qq.appId');
    const redirectUrl = this.configService.get('oauth.qq.redirectUrl');
    return `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&state=qq`;
  }

  /**
   * 处理QQ回调
   * @param code 授权码
   * @returns 用户信息
   */
  async handleQQCallback(code: string): Promise<OauthResultDto> {
    try {
      // 1. 获取 access_token
      const tokenUrl = `${this.configService.get('oauth.qq.accessTokenUrl')}?grant_type=authorization_code&client_id=${this.configService.get('oauth.qq.appId')}&client_secret=${this.configService.get('oauth.qq.appKey')}&code=${code}&redirect_uri=${encodeURIComponent(this.configService.get('oauth.qq.redirectUrl'))}`;

      const tokenResponse = await axios.get(tokenUrl);
      const tokenParams = qs.parse(tokenResponse.data);
      const accessToken = tokenParams.access_token as string;

      if (!accessToken) {
        throw new Error('QQ授权失败，无法获取访问令牌');
      }

      // 2. 获取OpenID
      const openIdUrl = `${this.configService.get('oauth.qq.userOpenidUrl')}?access_token=${accessToken}`;
      const openIdResponse = await axios.get(openIdUrl);

      // 从callback({"client_id":"YOUR_APPID","openid":"YOUR_OPENID"})中提取openid
      const openIdMatch = openIdResponse.data.match(/"openid":"([^"]+)"/);
      const openId = openIdMatch ? openIdMatch[1] : null;

      if (!openId) {
        throw new Error('QQ授权失败，无法获取OpenID');
      }

      // 3. 获取用户信息
      const userInfoUrl = `${this.configService.get('oauth.qq.userInfoUrl')}?access_token=${accessToken}&oauth_consumer_key=${this.configService.get('oauth.qq.appId')}&openid=${openId}`;
      const userResponse = await axios.get(userInfoUrl);

      const qqUser = {
        sourceId: openId,
        username: `qq_${openId.substring(0, 8)}`,
        nickname: userResponse.data.nickname,
        avatar: userResponse.data.figureurl_qq_2 || userResponse.data.figureurl_qq_1,
        email: '',
        loginType: 2, // QQ
        accessToken,
      };

      // 4. 登录或注册
      return await this.loginOrRegister(qqUser);
    } catch (error) {
      this.logger.error('QQ授权失败', error);
      return {
        success: false,
        message: 'QQ授权失败: ' + error.message,
      };
    }
  }

  /**
   * 处理第三方登录或注册
   * @param oauthUser 第三方用户信息
   * @returns 登录结果
   */
  async loginOrRegister(oauthUser: OauthUserDto): Promise<OauthResultDto> {
    try {
      // 1. 查询是否存在对应的第三方用户记录
      let oauthUserEntity = await this.oauthUserRepository.findOne({
        where: {
          sourceId: oauthUser.sourceId,
          loginType: oauthUser.loginType,
        },
      });

      // 2. 如果不存在，创建新记录
      if (!oauthUserEntity) {
        oauthUserEntity = this.oauthUserRepository.create({
          sourceId: oauthUser.sourceId,
          username: oauthUser.username,
          nickname: oauthUser.nickname,
          avatar: oauthUser.avatar,
          email: oauthUser.email,
          loginType: oauthUser.loginType,
          accessToken: oauthUser.accessToken,
        });
        await this.oauthUserRepository.save(oauthUserEntity);
      } else {
        // 3. 如果存在，更新记录
        oauthUserEntity.username = oauthUser.username;
        oauthUserEntity.nickname = oauthUser.nickname;
        oauthUserEntity.avatar = oauthUser.avatar;
        oauthUserEntity.email = oauthUser.email;
        oauthUserEntity.accessToken = oauthUser.accessToken;
        oauthUserEntity.updateTime = new Date();
        await this.oauthUserRepository.save(oauthUserEntity);
      }

      // 4. 查询对应的系统用户
      const user = await this.userService.findUserByOauth(oauthUser.sourceId, oauthUser.loginType);

      // 5. 如果系统用户存在，执行登录
      if (user) {
        const token = await this.userService.generateToken(user);
        return {
          success: true,
          userId: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          token,
        };
      }

      // 6. 如果系统用户不存在，创建新用户并登录
      const newUser = await this.userService.createUserFromOauth({
        username: oauthUser.username,
        nickname: oauthUser.nickname,
        avatar: oauthUser.avatar,
        email: oauthUser.email,
        loginType: oauthUser.loginType,
        sourceId: oauthUser.sourceId,
      });

      const token = await this.userService.generateToken(newUser);
      return {
        success: true,
        userId: newUser.id,
        username: newUser.username,
        nickname: newUser.nickname,
        avatar: newUser.avatar,
        token,
      };
    } catch (error) {
      this.logger.error('第三方登录失败', error);
      return {
        success: false,
        message: '第三方登录失败: ' + error.message,
      };
    }
  }
}
