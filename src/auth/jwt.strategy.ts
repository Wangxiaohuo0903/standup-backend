import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

export interface JwtPayload {
  userId: string;
  openid: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const result = await this.authService.validateUser(payload.userId, payload.tenantId);
    
    if (!result) {
      throw new UnauthorizedException('用户验证失败');
    }

    return {
      userId: payload.userId,
      openid: payload.openid,
      tenantId: payload.tenantId,
      user: result.user,
      tenant: result.tenant,
    };
  }
}