import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin.dto';
import { Public } from '../auth/public.decorator';

@Public()
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly admin: AdminService) {}

  // Brute-force himoyasi: bir IP'dan daqiqasiga 8 ta urinish
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.admin.login(dto.email, dto.password);
  }
}
