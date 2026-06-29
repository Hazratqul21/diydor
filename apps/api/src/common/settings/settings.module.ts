import { Global, Module } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';
import { PublicConfigController } from './public-config.controller';

@Global()
@Module({
  controllers: [PublicConfigController],
  providers: [AppSettingsService],
  exports: [AppSettingsService],
})
export class SettingsModule {}
