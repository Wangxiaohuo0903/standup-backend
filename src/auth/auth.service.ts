import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../config/prisma.service';
import { WeChatLoginDto } from './dto/wechat-login.dto';
import { generateId } from '../common/utils/id.util';
import axios from 'axios';

interface WeChatSessionResponse {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async wechatLogin(wechatLoginDto: WeChatLoginDto) {
    const { code, tenantId } = wechatLoginDto;

    // 验证租户是否存在
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new HttpException('租户不存在或已禁用', HttpStatus.BAD_REQUEST);
    }

    // 通过微信code获取openid
    const wechatSession = await this.getWeChatSession(code);
    
    if (!wechatSession.openid) {
      throw new HttpException('微信登录失败', HttpStatus.BAD_REQUEST);
    }

    // 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { openid: wechatSession.openid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: generateId(),
          openid: wechatSession.openid,
          unionid: wechatSession.unionid,
          status: 'ACTIVE',
        },
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new HttpException('用户账号已被禁用', HttpStatus.FORBIDDEN);
    }

    // 生成JWT token
    const payload = {
      userId: user.id,
      openid: user.openid,
      tenantId,
    };

    const token = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    return {
      token,
      user,
      expiresIn: this.parseExpiration(expiresIn),
    };
  }

  private async getWeChatSession(code: string): Promise<WeChatSessionResponse> {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      throw new HttpException('微信配置不完整', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: appId,
          secret: appSecret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      });

      const data: WeChatSessionResponse = response.data;

      if (data.errcode) {
        throw new HttpException(`微信API错误: ${data.errmsg}`, HttpStatus.BAD_REQUEST);
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('微信服务请求失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private parseExpiration(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 7200; // 默认2小时
    }
  }

  async validateUser(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.status !== 'ACTIVE') {
      return null;
    }

    return { user, tenant };
  }
}