import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as qs from 'qs';

/**
 * 第三方登录服务
 */
@Injectable()
export class OauthService {
  constructor(private configService: ConfigService) {}

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
  async handleGithubCallback(code: string): Promise<any> {
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

      return {
        id: userResponse.data.id,
        name: userResponse.data.name || userResponse.data.login,
        avatar: userResponse.data.avatar_url,
        email: userResponse.data.email,
        source: 'github',
        accessToken: access_token,
      };
    } catch (error) {
      console.error('GitHub授权失败', error);
      throw new Error('GitHub授权失败: ' + error.message);
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
  async handleGiteeCallback(code: string): Promise<any> {
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

      return {
        id: userResponse.data.id,
        name: userResponse.data.name || userResponse.data.login,
        avatar: userResponse.data.avatar_url,
        email: userResponse.data.email,
        source: 'gitee',
        accessToken: access_token,
      };
    } catch (error) {
      console.error('Gitee授权失败', error);
      throw new Error('Gitee授权失败: ' + error.message);
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
  async handleQQCallback(code: string): Promise<any> {
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

      return {
        id: openId,
        name: userResponse.data.nickname,
        avatar: userResponse.data.figureurl_qq_2 || userResponse.data.figureurl_qq_1,
        source: 'qq',
        accessToken,
      };
    } catch (error) {
      console.error('QQ授权失败', error);
      throw new Error('QQ授权失败: ' + error.message);
    }
  }
}
