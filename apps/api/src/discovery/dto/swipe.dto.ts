import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { SwipeAction } from '@prisma/client';

export class SwipeDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsEnum(SwipeAction)
  action: SwipeAction;
}
