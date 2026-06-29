import { Module } from '@nestjs/common';
import { PaymeService } from './payme.service';
import { PaymeController } from './payme.controller';
import { PaymeConfigService } from './payme-config.service';

@Module({
  providers: [PaymeService, PaymeConfigService],
  controllers: [PaymeController],
  exports: [PaymeService, PaymeConfigService], // EconomyService + AdminService ishlatadi
})
export class PaymentsModule {}
