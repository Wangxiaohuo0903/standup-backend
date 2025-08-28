import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum OrderStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  USED = 'used',
}

export class QueryOrdersDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value) || 10)
  pageSize?: number = 10;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;
}