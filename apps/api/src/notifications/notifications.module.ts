import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from '../matches/chat.gateway';
import { TelegramNotifyService } from './telegram-notify.service';

/**
 * Global bildirishnoma moduli: Socket.IO (ChatGateway) + Telegram push.
 * Butun ilovada inject qilinadi (matches, discovery, economy).
 */
@Global()
@Module({
  imports: [AuthModule],
  providers: [ChatGateway, TelegramNotifyService],
  exports: [ChatGateway, TelegramNotifyService],
})
export class NotificationsModule {}
