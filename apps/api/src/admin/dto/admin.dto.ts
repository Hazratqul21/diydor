import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SubTier, SubPeriod } from '@prisma/client';

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateReferralDto {
  /** Promouter ismi / izoh (jadvalda ko'rinadi). */
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  /** Ixtiyoriy maxsus kod; bo'sh bo'lsa tasodifiy generatsiya qilinadi. */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;
}

export class UpdateConfigDto {
  @IsOptional() @IsInt() @Min(0) trialDays?: number;
  @IsOptional() @IsInt() @Min(0) freeSwipesPerDay?: number;
  @IsOptional() @IsInt() @Min(0) freeSuperLikesPerWeek?: number;
  @IsOptional() @IsInt() @Min(1) coinToSom?: number;
  @IsOptional() @IsInt() @Min(0) receiverSharePercent?: number;
  @IsOptional() @IsInt() @Min(0) minWithdrawSom?: number;
  // ── Branding (Welcome ekrani) ──
  @IsOptional() @IsString() welcomeTitle?: string;
  @IsOptional() @IsString() welcomeSubtitle?: string;
  @IsOptional() @IsString() welcomeImageUrl?: string; // URL bevosita ham qo'yish mumkin
}

export class UploadWelcomeImageDto {
  @IsString() dataUrl: string; // data:image/...;base64,...
}

export class UpdatePaymentConfigDto {
  @IsOptional() @IsString() paymeMerchantId?: string;
  @IsOptional() @IsString() paymeEnv?: string; // 'test' | 'prod'
  @IsOptional() @IsString() paymeCheckoutUrl?: string;
  @IsOptional() @IsString() paymeKeyTest?: string; // bo'sh bo'lmasa yangilanadi
  @IsOptional() @IsString() paymeKeyProd?: string;
}

export class UpsertPlanDto {
  @IsEnum(SubTier) tier: SubTier;
  @IsEnum(SubPeriod) period: SubPeriod;
  @IsInt() @Min(0) priceSom: number;
  @IsOptional() @IsInt() @Min(0) discountPercent?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}
