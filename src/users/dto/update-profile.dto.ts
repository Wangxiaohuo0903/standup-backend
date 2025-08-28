import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsPhoneNumber('CN')
  phone?: string;

  @IsOptional()
  @IsString()
  realName?: string;
}