import { IsString, Length, Matches } from 'class-validator';

export class PhoneRequestDto {
  @IsString()
  @Matches(/^[0-9+\s()-]{9,20}$/, { message: 'Telefon raqami noto‘g‘ri' })
  phone: string;
}

export class PhoneVerifyDto {
  @IsString()
  @Matches(/^[0-9+\s()-]{9,20}$/, { message: 'Telefon raqami noto‘g‘ri' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'Kod 6 xonali bo‘lishi kerak' })
  code: string;
}
