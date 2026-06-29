import { IsInt, IsString, IsNotEmpty, Min } from 'class-validator';

export class SendGiftDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  giftKey: string;
}

export class PurchaseCoinsDto {
  @IsString()
  @IsNotEmpty()
  packageId: string;
}

export class WithdrawDto {
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @IsInt()
  @Min(1)
  amount: number;
}
