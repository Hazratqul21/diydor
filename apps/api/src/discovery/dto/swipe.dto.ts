import { IsEnum, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { SwipeAction } from '@prisma/client';

export class SwipeDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsEnum(SwipeAction)
  action: SwipeAction;

  // Platinum "Xabar yuborib tanishish" — tanishishdan oldingi birinchi xabar
  @IsOptional()
  @IsString()
  @MaxLength(300)
  message?: string;
}
