import { IsString, IsNotEmpty, IsDateString, IsNumber, IsArray, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  totalCount: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDateString()
  eventDate: string;

  @IsString()
  eventTime: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number = 90;

  @IsArray()
  @IsString({ each: true })
  performers: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @IsArray()
  @Type(() => CreatePriceOptionDto)
  priceOptions: CreatePriceOptionDto[];
}