import { IsEnum, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
