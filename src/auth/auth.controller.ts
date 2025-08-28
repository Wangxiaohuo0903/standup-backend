import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WeChatLoginDto } from './dto/wechat-login.dto';
import { ApiResponseDto } from '../common/dto/response.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat/login')
  @HttpCode(HttpStatus.OK)
  async wechatLogin(@Body() wechatLoginDto: WeChatLoginDto) {
    const result = await this.authService.wechatLogin(wechatLoginDto);
    return ApiResponseDto.success(result, '登录成功');
  }
}