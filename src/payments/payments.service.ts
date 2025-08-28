import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../config/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { WeChatPayDto, RefundDto, WeChatPayParams } from './dto/payment.dto';
import { createHash, randomBytes } from 'crypto';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  async createWeChatPayment(userId: string, weChatPayDto: WeChatPayDto) {
    const { orderId } = weChatPayDto;

    // 验证订单
    const order = await this.ordersService.findOne(orderId, userId);

    if (order.status !== 'PENDING') {
      throw new BadRequestException('订单状态不正确，无法支付');
    }

    // 生成微信支付参数
    const payParams = await this.generateWeChatPayParams(order);
    return payParams;
  }

  private async generateWeChatPayParams(order: any): Promise<WeChatPayParams> {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const mchId = this.configService.get<string>('WECHAT_MCH_ID');
    const mchKey = this.configService.get<string>('WECHAT_MCH_KEY');

    if (!appId || !mchId || !mchKey) {
      throw new BadRequestException('微信支付配置不完整');
    }

    // 生成预支付交易会话标识
    const prepayId = await this.createWeChatUnifiedOrder(order, appId, mchId, mchKey);

    // 生成小程序支付参数
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = randomBytes(16).toString('hex');
    const packageStr = `prepay_id=${prepayId}`;
    const signType = 'MD5';

    // 生成签名
    const signStr = `appId=${appId}&nonceStr=${nonceStr}&package=${packageStr}&signType=${signType}&timeStamp=${timeStamp}&key=${mchKey}`;
    const paySign = createHash('md5').update(signStr).digest('hex').toUpperCase();

    return {
      appId,
      timeStamp,
      nonceStr,
      package: packageStr,
      signType,
      paySign,
    };
  }

  private async createWeChatUnifiedOrder(
    order: any,
    appId: string,
    mchId: string,
    mchKey: string
  ): Promise<string> {
    // 这里是简化版本，实际生产环境需要完整的微信支付API调用
    // 包括XML格式的请求体构建、签名生成、HTTPS请求等

    const nonceStr = randomBytes(16).toString('hex');
    const totalFee = Math.round(Number(order.totalAmount) * 100); // 转换为分
    const outTradeNo = order.id;
    const body = `${order.event.title} - ${order.priceOption.name}`;
    const notifyUrl = `${this.configService.get('BASE_URL', 'http://localhost:3000')}/api/payments/wechat/notify`;

    // 构建签名参数
    const signParams = {
      appid: appId,
      mch_id: mchId,
      nonce_str: nonceStr,
      body,
      out_trade_no: outTradeNo,
      total_fee: totalFee,
      spbill_create_ip: '127.0.0.1',
      notify_url: notifyUrl,
      trade_type: 'JSAPI',
      openid: order.user.openid,
    };

    // 生成签名
    const signStr = Object.keys(signParams)
      .sort()
      .map(key => `${key}=${signParams[key]}`)
      .join('&') + `&key=${mchKey}`;
    
    const sign = createHash('md5').update(signStr).digest('hex').toUpperCase();

    // 构建XML请求体
    const xmlData = this.buildXmlData({ ...signParams, sign });

    try {
      // 调用微信统一下单API
      const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xmlData, {
        headers: { 'Content-Type': 'application/xml' },
      });

      // 解析响应（这里需要XML解析，简化处理）
      const prepayId = this.extractPrepayId(response.data);
      
      if (!prepayId) {
        throw new BadRequestException('创建微信支付订单失败');
      }

      return prepayId;
    } catch (error) {
      this.logger.error('微信支付统一下单失败', error);
      throw new BadRequestException('微信支付服务异常');
    }
  }

  private buildXmlData(params: any): string {
    let xml = '<xml>';
    Object.keys(params).forEach(key => {
      xml += `<${key}><![CDATA[${params[key]}]]></${key}>`;
    });
    xml += '</xml>';
    return xml;
  }

  private extractPrepayId(xmlResponse: string): string | null {
    // 简化的XML解析，实际应使用专业的XML解析库
    const match = xmlResponse.match(/<prepay_id><!\[CDATA\[(.*?)\]\]><\/prepay_id>/);
    return match ? match[1] : null;
  }

  async handleWeChatNotify(xmlData: string) {
    try {
      // 解析微信支付回调数据（简化处理）
      const data = this.parseWeChatNotifyXml(xmlData);
      
      if (data.return_code !== 'SUCCESS' || data.result_code !== 'SUCCESS') {
        this.logger.error('微信支付回调失败', data);
        return this.buildWeChatNotifyResponse('FAIL', '支付失败');
      }

      // 验证签名
      if (!this.verifyWeChatSign(data)) {
        this.logger.error('微信支付回调签名验证失败');
        return this.buildWeChatNotifyResponse('FAIL', '签名验证失败');
      }

      // 更新订单状态
      await this.ordersService.updatePaymentStatus(
        data.out_trade_no,
        data.transaction_id
      );

      this.logger.log(`订单 ${data.out_trade_no} 支付成功`);
      return this.buildWeChatNotifyResponse('SUCCESS', 'OK');

    } catch (error) {
      this.logger.error('处理微信支付回调失败', error);
      return this.buildWeChatNotifyResponse('FAIL', '处理失败');
    }
  }

  private parseWeChatNotifyXml(xmlData: string): any {
    // 简化的XML解析，实际应使用xml2js等库
    const data: any = {};
    const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>/g;
    let match;
    
    while ((match = regex.exec(xmlData)) !== null) {
      data[match[1]] = match[2];
    }
    
    return data;
  }

  private verifyWeChatSign(data: any): boolean {
    const mchKey = this.configService.get<string>('WECHAT_MCH_KEY');
    const sign = data.sign;
    delete data.sign;

    const signStr = Object.keys(data)
      .sort()
      .filter(key => data[key])
      .map(key => `${key}=${data[key]}`)
      .join('&') + `&key=${mchKey}`;

    const computedSign = createHash('md5').update(signStr).digest('hex').toUpperCase();
    return computedSign === sign;
  }

  private buildWeChatNotifyResponse(returnCode: string, returnMsg: string): string {
    return `<xml><return_code><![CDATA[${returnCode}]]></return_code><return_msg><![CDATA[${returnMsg}]]></return_msg></xml>`;
  }

  async requestRefund(userId: string, refundDto: RefundDto) {
    const { orderId, reason = '用户申请退款' } = refundDto;

    // 验证订单
    const order = await this.ordersService.findOne(orderId, userId);

    if (order.status !== 'PAID') {
      throw new BadRequestException('只有已支付的订单才能申请退款');
    }

    // 检查退款时限（这里设为演出开始前24小时）
    const eventDateTime = new Date(`${order.event.eventDate.toISOString().split('T')[0]}T${order.event.eventTime.toISOString().split('T')[1]}`);
    const twentyFourHoursLater = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    if (eventDateTime < twentyFourHoursLater) {
      throw new BadRequestException('演出开始前24小时内不支持退款');
    }

    // 调用微信退款API（简化实现）
    const success = await this.processWeChatRefund(order, reason);

    if (success) {
      // 更新订单状态
      return this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        },
      });
    } else {
      throw new BadRequestException('退款申请失败，请稍后重试');
    }
  }

  private async processWeChatRefund(order: any, reason: string): Promise<boolean> {
    // 微信退款API调用的简化实现
    // 实际生产环境需要调用微信退款接口
    this.logger.log(`处理退款请求: 订单${order.id}, 金额${order.totalAmount}, 原因${reason}`);
    
    // 这里返回true表示退款成功，实际需要根据微信API响应判断
    return true;
  }
}