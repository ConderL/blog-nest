import { Controller, Get, Query, Redirect, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { OauthService } from '../../services/oauth/oauth.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('第三方登录')
@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取GitHub登录地址
   */
  @Get('github')
  @ApiOperation({ summary: '获取GitHub登录地址' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取GitHub登录地址成功' })
  @Redirect()
  getGithubAuthUrl() {
    const url = this.oauthService.getGithubAuthUrl();
    return { url, statusCode: HttpStatus.FOUND };
  }

  /**
   * 处理GitHub回调
   * @param code 授权码
   */
  @Get('github/callback')
  @ApiOperation({ summary: '处理GitHub回调' })
  @ApiQuery({ name: 'code', description: '授权码', required: true })
  @ApiResponse({ status: HttpStatus.OK, description: 'GitHub登录成功' })
  async handleGithubCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      // 获取用户信息
      const userInfo = await this.oauthService.handleGithubCallback(code);

      // 重定向到前端页面，带上用户信息
      const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
      const redirectUrl = `${frontendUrl}/oauth/callback?source=github&success=true&id=${userInfo.id}&name=${encodeURIComponent(userInfo.name)}&avatar=${encodeURIComponent(userInfo.avatar)}&email=${encodeURIComponent(userInfo.email || '')}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      // 登录失败，重定向到前端页面，带上错误信息
      const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
      const redirectUrl = `${frontendUrl}/oauth/callback?source=github&success=false&message=${encodeURIComponent(error.message)}`;

      return res.redirect(redirectUrl);
    }
  }

  /**
   * 获取Gitee登录地址
   */
  @Get('gitee')
  @ApiOperation({ summary: '获取Gitee登录地址' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取Gitee登录地址成功' })
  @Redirect()
  getGiteeAuthUrl() {
    const url = this.oauthService.getGiteeAuthUrl();
    return { url, statusCode: HttpStatus.FOUND };
  }

  /**
   * 处理Gitee回调
   * @param code 授权码
   */
  @Get('gitee/callback')
  @ApiOperation({ summary: '处理Gitee回调' })
  @ApiQuery({ name: 'code', description: '授权码', required: true })
  @ApiResponse({ status: HttpStatus.OK, description: 'Gitee登录成功' })
  async handleGiteeCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      // 获取用户信息
      const userInfo = await this.oauthService.handleGiteeCallback(code);

      // 重定向到前端页面，带上用户信息
      const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
      const redirectUrl = `${frontendUrl}/oauth/callback?source=gitee&success=true&id=${userInfo.id}&name=${encodeURIComponent(userInfo.name)}&avatar=${encodeURIComponent(userInfo.avatar)}&email=${encodeURIComponent(userInfo.email || '')}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      // 登录失败，重定向到前端页面，带上错误信息
      const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
      const redirectUrl = `${frontendUrl}/oauth/callback?source=gitee&success=false&message=${encodeURIComponent(error.message)}`;

      return res.redirect(redirectUrl);
    }
  }

  /**
   * 获取QQ登录地址
   */
  @Get('qq')
  @ApiOperation({ summary: '获取QQ登录地址' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取QQ登录地址成功' })
  @Redirect()
  getQQAuthUrl() {
    const url = this.oauthService.getQQAuthUrl();
    return { url, statusCode: HttpStatus.FOUND };
  }

  /**
   * 处理QQ回调
   * @param code 授权码
   */
  @Get('qq/callback')
  @ApiOperation({ summary: '处理QQ回调' })
  @ApiQuery({ name: 'code', description: '授权码', required: true })
  @ApiResponse({ status: HttpStatus.OK, description: 'QQ登录成功' })
  async handleQQCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      // 获取用户信息
      const userInfo = await this.oauthService.handleQQCallback(code);

      // 重定向到前端页面，带上用户信息
      const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
      const redirectUrl = `${frontendUrl}/oauth/callback?source=qq&success=true&id=${userInfo.id}&name=${encodeURIComponent(userInfo.name)}&avatar=${encodeURIComponent(userInfo.avatar)}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      // 登录失败，重定向到前端页面，带上错误信息
      const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
      const redirectUrl = `${frontendUrl}/oauth/callback?source=qq&success=false&message=${encodeURIComponent(error.message)}`;

      return res.redirect(redirectUrl);
    }
  }
}
