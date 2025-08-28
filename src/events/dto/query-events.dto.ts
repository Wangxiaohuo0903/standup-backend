import { IsOptional, IsString, IsDateString, IsEnum, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum EventStatusEnum {
  UPCOMING = 'upcoming',
  ON_SALE = 'onSale',
  SOLD_OUT = 'soldOut',
  CANCELLED = 'cancelled',
}

export class QueryEventsDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @IsOptional()
  @IsNumberString()
  @Transform(({ value }) => parseInt(value) || 10)
  pageSize?: number = 10;

  @IsOptional()
  @IsEnum(EventStatusEnum)
  status?: EventStatusEnum;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  city?: string;
}