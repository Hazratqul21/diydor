import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GuestLoginDto {
  /** Ixtiyoriy ism (onboarding'da so'ralsa). Bo'lmasa "Mehmon". */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;
}
