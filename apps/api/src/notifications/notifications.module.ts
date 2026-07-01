import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from '../matches/chat.gateway';
import { TelegramNotifyService } from './telegram-notify.service';
import { TelegramWebhookController } from './telegram-webhook.controller';

/**
 * Global bildirishnoma moduli: Socket.IO (ChatGateway) + Telegram push + webhook.
 * Butun ilovada inject qilinadi (matches, discovery, economy).
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [TelegramWebhookController],
  providers: [ChatGateway, TelegramNotifyService],
  exports: [ChatGateway, TelegramNotifyService],
})
export class NotificationsModule {}
