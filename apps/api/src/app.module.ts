import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './common/settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PhotosModule } from './photos/photos.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { MatchesModule } from './matches/matches.module';
import { EconomyModule } from './economy/economy.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { SafetyModule } from './safety/safety.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // Rate-limit: IP'dan daqiqasiga 300 so'rov (brute-force/abusega qarshi).
    // Storage = Redis (cluster/multi-instance'da izchil hisoblash uchun).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          throttlers: [{ ttl: 60_000, limit: 300 }],
          // REDIS_URL bo'lsa Redis, bo'lmasa default (in-memory) storage
          ...(redisUrl
            ? { storage: new ThrottlerStorageRedisService(new Redis(redisUrl)) }
            : {}),
        };
      },
    }),
    PrismaModule,
    SettingsModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    PhotosModule,
    DiscoveryModule,
    MatchesModule,
    EconomyModule,
    SubscriptionsModule,
    PaymentsModule,
    AdminModule,
    SafetyModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
