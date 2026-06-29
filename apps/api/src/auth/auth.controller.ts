import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { PhoneRequestDto, PhoneVerifyDto } from './dto/phone.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** TMA dan initData yuboriladi -> JWT qaytariladi */
  @Public()
  @Post('telegram')
  telegram(@Body() dto: TelegramLoginDto) {
    return this.authService.loginWithTelegram(dto.initData);
  }

  /** Mustaqil ilova: mehmon (anonim) kirish -> JWT */
  @Public()
  @Post('guest')
  guest(@Body() dto: GuestLoginDto) {
    return this.authService.loginAsGuest(dto.firstName);
  }

  /** Telefon OTP so'rovi (Flutter/standalone). Abusega qarshi qattiq limit. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('phone/request')
  phoneRequest(@Body() dto: PhoneRequestDto) {
    return this.authService.requestPhoneOtp(dto.phone);
  }

  /** Telefon OTP tasdiqlash -> JWT */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('phone/verify')
  phoneVerify(@Body() dto: PhoneVerifyDto) {
    return this.authService.verifyPhoneOtp(dto.phone, dto.code);
  }
}
