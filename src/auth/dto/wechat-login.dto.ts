import { IsString, IsNotEmpty } from 'class-validator';

export class WeChatLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}