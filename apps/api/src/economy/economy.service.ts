import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymeService } from '../payments/payme.service';
import { AppSettingsService } from '../common/settings/app-settings.service';
import { ChatGateway } from '../matches/chat.gateway';
import { TelegramNotifyService } from '../notifications/telegram-notify.service';
import { COIN_PACKAGES, findPackage } from './economy.constants';

@Injectable()
export class EconomyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payme: PaymeService,
    private readonly config: ConfigService,
    private readonly settings: AppSettingsService,
    private readonly chatGateway: ChatGateway,
    private readonly telegram: TelegramNotifyService,
  ) {}

  /**
   * Tanga sotib olish uchun Order yaratadi va Payme checkout manzilini qaytaradi.
   * Foydalanuvchi checkout'da to'laydi -> Payme PerformTransaction -> tanga qo'shiladi.
   */
  async createCoinOrder(userId: string, packageId: string) {
    const buyer = await this.prisma.user.findUnique({ where: { id: userId }, select: { gender: true } });
    if (buyer?.gender === 'FEMALE') {
      throw new BadRequestException('Ayollar uchun imkoniyatlar bepul — tanga sotib olish shart emas');
    }
    const pkg = findPackage(packageId);
    if (!pkg) throw new BadRequestException('Paket topilmadi');

    const order = await this.prisma.order.create({
      data: {
        userId,
        type: 'COIN_PURCHASE',
        packageId: pkg.id,
        coins: pkg.coins + pkg.bonus,
        amount: pkg.priceSom * 100, // so'm -> tiyin
        state: 'PENDING',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount, // tiyin
      priceSom: pkg.priceSom,
      coins: order.coins,
      checkoutUrl: await this.payme.buildCheckoutUrl(order.id, order.amount),
    };
  }

  async getGiftCatalog() {
    return this.prisma.giftItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  getCoinPackages() {
    return COIN_PACKAGES;
  }

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true, walletBalance: true },
    });
    if (!user) throw new NotFoundException('User topilmadi');

    const received = await this.prisma.giftTransaction.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { fromUser: { select: { id: true, firstName: true, photos: { take: 1, orderBy: { order: 'asc' } } } } },
    });

    const cfg = await this.settings.get();
    return {
      coinBalance: user.coinBalance,
      walletBalance: user.walletBalance,
      minWithdrawSom: cfg.minWithdrawSom,
      gifts: received.map((g) => ({
        id: g.id,
        giftKey: g.giftKey,
        earnedSom: g.earnedSom,
        createdAt: g.createdAt,
        from: {
          id: g.fromUser.id,
          firstName: g.fromUser.firstName,
          photoUrl: g.fromUser.photos[0]?.url ?? null,
        },
      })),
    };
  }

  /**
   * Chatда sovg'a yuborish — faqat match a'zolari. Atomik tranzaksiya:
   * - race'ga qarshi shartli decrement (faqat balans yetsa, manfiyga tushmaydi);
   * - faqat SOTIB OLINGAN tanga (paidCoinBalance) oluvchining yechiladigan
   *   so'miga aylanadi — bepul/promo tanga real pul yaratmaydi (teshik yopiq).
   */
  async sendGift(senderId: string, matchId: string, giftKey: string) {
    const gift = await this.prisma.giftItem.findUnique({ where: { key: giftKey } });
    if (!gift) throw new BadRequestException('Sovg\'a topilmadi');
    if (!gift.isActive) throw new BadRequestException('Sovg\'a hozirda faol emas');

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match topilmadi');
    if (match.userAId !== senderId && match.userBId !== senderId) {
      throw new ForbiddenException('Bu suhbat sizniki emas');
    }
    const receiverId = match.userAId === senderId ? match.userBId : match.userAId;

    const { message, coinBalance } = await this.prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({
        where: { id: senderId },
        select: { coinBalance: true },
      });
      if (!sender || sender.coinBalance < gift.priceCoins) {
        throw new BadRequestException('Tanga yetarli emas');
      }

      // Yangi mantiq: Har qanday tangadan (bepul/pullik) qat'i nazar
      // belgilangan cashoutSom miqdorida pul tushadi. Komissiya narxda ushlanib qoladi.
      const earnedSom = gift.cashoutSom;

      // Shartli decrement — bir vaqtli sovg'alarda balans manfiyga tushmaydi
      const dec = await tx.user.updateMany({
        where: { id: senderId, coinBalance: { gte: gift.priceCoins } },
        data: {
          coinBalance: { decrement: gift.priceCoins },
        },
      });
      if (dec.count !== 1) throw new BadRequestException('Tanga yetarli emas');

      if (earnedSom > 0) {
        await tx.user.update({
          where: { id: receiverId },
          data: { walletBalance: { increment: earnedSom } },
        });
      }
      await tx.giftTransaction.create({
        data: { fromUserId: senderId, toUserId: receiverId, matchId, giftKey, coinAmount: gift.priceCoins, earnedSom },
      });
      const message = await tx.message.create({
        data: { matchId, senderId, type: 'GIFT', content: giftKey },
      });
      const updated = await tx.user.findUnique({ where: { id: senderId }, select: { coinBalance: true } });
      return { message, coinBalance: updated!.coinBalance };
    });

    // Oluvchini xabardor qilamiz (real-time + offline'da Telegram push)
    this.chatGateway.notifyNewMessage(receiverId, message);
    void (async () => {
      if (!(await this.chatGateway.isOnline(receiverId))) {
        const sender = await this.prisma.user.findUnique({
          where: { id: senderId },
          select: { firstName: true },
        });
        await this.telegram.sendToUser(
          receiverId,
          `🎁 <b>${sender?.firstName ?? 'Kimdir'}</b> sizga sovg'a yubordi`,
        );
      }
    })();

    return { coinBalance, message };
  }

  /**
   * Tanga sotib olish — STUB (haqiqiy to'lov YO'Q).
   * To'lov hujjati (Payme/Click) kelgach shu yerga ulanadi.
   * FAQAT dev/test muhitida ishlaydi — productionda to'lovsiz tanga
   * kreditlash imkoniyatini yopib qo'yamiz.
   */
  async purchaseCoins(userId: string, packageId: string) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Bu endpoint productionda ishlamaydi, /coins/order dan foydalaning');
    }
    const pkg = findPackage(packageId);
    if (!pkg) throw new BadRequestException('Paket topilmadi');

    // TODO: haqiqiy to'lov tasdig'i (Payme/Click webhook) — hozircha to'g'ridan-to'g'ri kreditlanadi
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: pkg.coins + pkg.bonus } },
      select: { coinBalance: true },
    });
    return { coinBalance: user.coinBalance, added: pkg.coins + pkg.bonus, stub: true };
  }

  /**
   * Pul yechish — STUB (haqiqiy payout YO'Q, litsenziyali PSP keyin).
   */
  async withdraw(userId: string, cardNumber: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
    if (!user) throw new NotFoundException('User topilmadi');
    const cfg = await this.settings.get();
    if (amount < cfg.minWithdrawSom) {
      throw new BadRequestException(`Minimal yechish summasi ${cfg.minWithdrawSom.toLocaleString('ru-RU')} so'm`);
    }
    if (amount > user.walletBalance) throw new BadRequestException('Balans yetarli emas');

    const card = cardNumber.replace(/\s+/g, '');
    if (card.length < 16) throw new BadRequestException('Karta raqami noto\'g\'ri');

    // Mablag'ni hamyondan ushlaymiz va so'rov yaratamiz — admin QO'LDA kartaga o'tkazadi.
    // (Litsenziyali PSP payout API kelguncha vaqtinchalik yechim.)
    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
        select: { walletBalance: true },
      }),
      this.prisma.withdrawalRequest.create({
        data: { userId, amountSom: amount, cardNumber: card, status: 'PENDING' },
      }),
    ]);
    return { walletBalance: updated.walletBalance, requested: amount, status: 'pending' };
  }
}
