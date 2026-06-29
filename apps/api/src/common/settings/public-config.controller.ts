import { Controller, Get } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { Public } from '../../auth/public.decorator';

/**
 * Ommaviy (auth'siz) konfiguratsiya — Welcome ekrani login'dan oldin o'qiydi.
 * Faqat brending maydonlari qaytariladi (maxfiy hech narsa yo'q).
 */
@Public()
@Controller('config')
export class PublicConfigController {
  constructor(private readonly settings: AppSettingsService) {}

  @Get('public')
  async getPublic() {
    const cfg = await this.settings.get();
    return {
      welcomeImageUrl: cfg.welcomeImageUrl ?? null,
      welcomeTitle: cfg.welcomeTitle ?? null,
      welcomeSubtitle: cfg.welcomeSubtitle ?? null,
    };
  }
}
