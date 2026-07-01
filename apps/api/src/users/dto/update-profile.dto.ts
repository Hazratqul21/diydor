import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsArray,
  IsBoolean,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Gender, Intent, SeekingGender } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(SeekingGender)
  seekingGender?: SeekingGender;

  /** ISO sana, masalan "2000-05-15". 18+ tekshiriladi. */
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(Intent)
  intent?: Intent;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  interests?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  notifyShowSender?: boolean;
}
