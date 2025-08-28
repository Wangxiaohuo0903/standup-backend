import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class WeChatPayDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class RefundDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export interface WeChatPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}