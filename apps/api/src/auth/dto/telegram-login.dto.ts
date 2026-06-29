import { IsString, IsNotEmpty } from 'class-validator';

export class TelegramLoginDto {
  /** Telegram WebApp.initData (xom URL-encoded string) */
  @IsString()
  @IsNotEmpty()
  initData: string;
}
