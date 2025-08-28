import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum StatsPeriod {
  TODAY = 'today',
  THIS_WEEK = 'thisWeek',
  THIS_MONTH = 'thisMonth',
  THIS_YEAR = 'thisYear',
}

export class StatsQueryDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod = StatsPeriod.THIS_MONTH;
}