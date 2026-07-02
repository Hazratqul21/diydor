import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TelegramLoginDto {
  /** Telegram WebApp.initData (xom URL-encoded string) */
  @IsString()
  @IsNotEmpty()
  initData: string;

  /**
   * Referal kodi (zaxira yo'l): initData.start_param bo'lmasa ishlatiladi
   * (masalan, /start <kod> dan keyin web_app tugma ?ref= bilan ochilganda).
   */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ref?: string;
}
