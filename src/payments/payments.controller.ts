import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  Res,
  HttpStatus 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { WeChatPayDto, RefundDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, RequestUser } from '../common/decorators/user.decorator';
import { ApiResponseDto } from '../common/dto/response.dto';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('wechat')
  @UseGuards(JwtAuthGuard)
  async createWeChatPayment(
    @CurrentUser() user: RequestUser,
    @Body() weChatPayDto: WeChatPayDto,
  ) {
    const payParams = await this.paymentsService.createWeChatPayment(
      user.userId,
      weChatPayDto,
    );
    return ApiResponseDto.success(payParams, '支付参数生成成功');
  }

  @Post('wechat/notify')
  async weChatNotify(@Req() req: Request, @Res() res: Response) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      const response = await this.paymentsService.handleWeChatNotify(body);
      res.status(HttpStatus.OK).send(response);
    });
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async requestRefund(
    @CurrentUser() user: RequestUser,
    @Body() refundDto: RefundDto,
  ) {
    const order = await this.paymentsService.requestRefund(user.userId, refundDto);
    return ApiResponseDto.success(order, '退款申请提交成功');
  }
}