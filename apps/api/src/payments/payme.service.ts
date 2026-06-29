import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, OrderState, Prisma, SubPeriod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymeErrorCode,
  TransactionState,
  TRANSACTION_TIMEOUT_MS,
} from './payme.constants';
import {
  PaymeException,
  cantDoOperation,
  invalidAmount,
  orderInProgress,
  orderNotFound,
  transactionNotFound,
} from './payme.exception';
import { PaymeParams } from './dto/payme-request.dto';
import { PaymeConfigService } from './payme-config.service';

@Injectable()
export class PaymeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly paymeConfig: PaymeConfigService,
  ) {}

  // ─────────────── Auth ───────────────

  /** Authorization: Basic base64("Paycom:" + KEY) — kalit admin config yoki .env'dan. */
  async checkAuth(header?: string): Promise<boolean> {
    if (!header || !header.startsWith('Basic ')) return false;
    let decoded: string;
    try {
      decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    } catch {
      return false;
    }
    const idx = decoded.indexOf(':');
    if (idx === -1) return false;
    const login = decoded.slice(0, idx);
    const key = decoded.slice(idx + 1);
    const { key: merchantKey } = await this.paymeConfig.get();
    return login === 'Paycom' && key.length > 0 && key === merchantKey;
  }

  // ─────────────── Dispatch ───────────────

  async dispatch(method: string | undefined, params: PaymeParams = {}) {
    switch (method) {
      case 'CheckPerformTransaction':
        return this.checkPerformTransaction(params);
      case 'CreateTransaction':
        return this.createTransaction(params);
      case 'PerformTransaction':
        return this.performTransaction(params);
      case 'CancelTransaction':
        return this.cancelTransaction(params);
      case 'CheckTransaction':
        return this.checkTransaction(params);
      case 'GetStatement':
        return this.getStatement(params);
      default:
        throw new PaymeException(PaymeErrorCode.MethodNotFound, 'Method not found');
    }
  }

  // ─────────────── Yordamchilar ───────────────

  private async findOrder(params: PaymeParams) {
    const orderId = params.account?.order_id;
    if (!orderId) throw orderNotFound();
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw orderNotFound();
    return order;
  }

  private assertAmount(orderAmount: number, paymeAmount: number | undefined) {
    if (paymeAmount !== orderAmount) throw invalidAmount();
  }

  // ─────────────── 1. CheckPerformTransaction ───────────────

  async checkPerformTransaction(params: PaymeParams) {
    const order = await this.findOrder(params);
    this.assertAmount(order.amount, params.amount);
    if (order.state !== OrderState.PENDING) {
      // allaqachon to'langan/bekor — yangi to'lov mumkin emas
      throw cantDoOperation();
    }
    return { allow: true };
  }

  // ─────────────── 2. CreateTransaction ───────────────

  async createTransaction(params: PaymeParams) {
    const { id, time, amount } = params;

    const existing = await this.prisma.paymeTransaction.findUnique({ where: { id } });
    if (existing) {
      if (existing.state !== TransactionState.Created) throw cantDoOperation();
      if (this.isExpired(existing.paycomTime)) {
        await this.markCancelled(existing.id, existing.orderId, TransactionState.CancelledAfterCreate, 4);
        throw cantDoOperation();
      }
      return {
        create_time: Number(existing.createTime),
        transaction: existing.orderId,
        state: existing.state,
      };
    }

    const order = await this.findOrder(params);
    this.assertAmount(order.amount, amount);
    if (order.state !== OrderState.PENDING) throw cantDoOperation();

    // Bir order uchun boshqa faol tranzaksiya bo'lmasligi kerak
    const active = await this.prisma.paymeTransaction.findFirst({
      where: { orderId: order.id, state: TransactionState.Created },
    });
    if (active) throw orderInProgress();

    const now = Date.now();
    const tx = await this.prisma.paymeTransaction.create({
      data: {
        id: id!,
        orderId: order.id,
        amount: amount!,
        state: TransactionState.Created,
        paycomTime: BigInt(time ?? now),
        createTime: BigInt(now),
      },
    });

    return { create_time: now, transaction: tx.orderId, state: TransactionState.Created };
  }

  // ─────────────── 3. PerformTransaction ───────────────

  async performTransaction(params: PaymeParams) {
    const tx = await this.prisma.paymeTransaction.findUnique({
      where: { id: params.id },
      include: { order: true },
    });
    if (!tx) throw transactionNotFound();

    if (tx.state === TransactionState.Paid) {
      return { transaction: tx.orderId, perform_time: Number(tx.performTime), state: tx.state };
    }
    if (tx.state !== TransactionState.Created) throw cantDoOperation();
    if (this.isExpired(tx.paycomTime)) {
      await this.markCancelled(tx.id, tx.orderId, TransactionState.CancelledAfterCreate, 4);
      throw cantDoOperation();
    }

    const now = Date.now();
    // Tovar yetkazish operatsiyasini oldindan tayyorlaymiz (obuna uchun joriy
    // muddatni o'qish kerak bo'lishi mumkin) — keyin atomar transactionga beramiz.
    const fulfillOp = await this.buildFulfillOp(tx.order);
    await this.prisma.$transaction([
      this.prisma.paymeTransaction.update({
        where: { id: tx.id },
        data: { state: TransactionState.Paid, performTime: BigInt(now) },
      }),
      this.prisma.order.update({ where: { id: tx.orderId }, data: { state: OrderState.PAID } }),
      fulfillOp(),
    ]);

    return { transaction: tx.orderId, perform_time: now, state: TransactionState.Paid };
  }

  // ─────────────── 4. CancelTransaction ───────────────

  async cancelTransaction(params: PaymeParams) {
    const tx = await this.prisma.paymeTransaction.findUnique({
      where: { id: params.id },
      include: { order: true },
    });
    if (!tx) throw transactionNotFound();

    const now = Date.now();

    if (tx.state === TransactionState.Created) {
      await this.markCancelled(tx.id, tx.orderId, TransactionState.CancelledAfterCreate, params.reason);
      return { transaction: tx.orderId, cancel_time: now, state: TransactionState.CancelledAfterCreate };
    }

    if (tx.state === TransactionState.Paid) {
      // To'langan order bekor qilinadi (refund) — tovar qaytarib olinadi
      const revertOp = await this.buildRevertOp(tx.order);
      await this.prisma.$transaction([
        this.prisma.paymeTransaction.update({
          where: { id: tx.id },
          data: { state: TransactionState.CancelledAfterPaid, cancelTime: BigInt(now), reason: params.reason },
        }),
        this.prisma.order.update({ where: { id: tx.orderId }, data: { state: OrderState.CANCELLED } }),
        revertOp(),
      ]);
      return { transaction: tx.orderId, cancel_time: now, state: TransactionState.CancelledAfterPaid };
    }

    // Allaqachon bekor qilingan — idempotent
    return { transaction: tx.orderId, cancel_time: Number(tx.cancelTime), state: tx.state };
  }

  // ─────────────── 5. CheckTransaction ───────────────

  async checkTransaction(params: PaymeParams) {
    const tx = await this.prisma.paymeTransaction.findUnique({ where: { id: params.id } });
    if (!tx) throw transactionNotFound();
    return {
      create_time: Number(tx.createTime),
      perform_time: Number(tx.performTime),
      cancel_time: Number(tx.cancelTime),
      transaction: tx.orderId,
      state: tx.state,
      reason: tx.reason ?? null,
    };
  }

  // ─────────────── 6. GetStatement ───────────────

  async getStatement(params: PaymeParams) {
    const { from, to } = params;
    const txs = await this.prisma.paymeTransaction.findMany({
      where: { paycomTime: { gte: BigInt(from ?? 0), lte: BigInt(to ?? Date.now()) } },
      orderBy: { paycomTime: 'asc' },
    });
    return {
      transactions: txs.map((t) => ({
        id: t.id,
        time: Number(t.paycomTime),
        amount: t.amount,
        account: { order_id: t.orderId },
        create_time: Number(t.createTime),
        perform_time: Number(t.performTime),
        cancel_time: Number(t.cancelTime),
        transaction: t.orderId,
        state: t.state,
        reason: t.reason ?? null,
      })),
    };
  }

  // ─────────────── Ichki yordamchilar ───────────────

  private isExpired(paycomTime: bigint): boolean {
    return Date.now() - Number(paycomTime) > TRANSACTION_TIMEOUT_MS;
  }

  private async markCancelled(txId: string, orderId: string, state: number, reason?: number) {
    await this.prisma.$transaction([
      this.prisma.paymeTransaction.update({
        where: { id: txId },
        data: { state, cancelTime: BigInt(Date.now()), reason: reason ?? null },
      }),
      this.prisma.order.update({ where: { id: orderId }, data: { state: OrderState.CANCELLED } }),
    ]);
  }

  // ─────────────── Tovar yetkazish (order.type bo'yicha) ───────────────

  private readonly periodDays: Record<SubPeriod, number> = { WEEK: 7, MONTH: 30, YEAR: 365 };

  /**
   * To'lov muvaffaqiyatli — order turiga qarab tovar yetkazish operatsiyasini
   * tayyorlaydi. Thunk qaytaradi (async unwrap'dan saqlanish uchun): chaqirilganda
   * lazy PrismaPromise beradi, u transaction ichida atomar bajariladi.
   */
  private async buildFulfillOp(order: Order): Promise<() => Prisma.PrismaPromise<unknown>> {
    if (order.type === 'SUBSCRIPTION' && order.subTier && order.subPeriod) {
      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { subscriptionUntil: true },
      });
      // Mavjud obuna tugamagan bo'lsa — uning ustiga qo'shamiz (yangilash)
      const base =
        user?.subscriptionUntil && user.subscriptionUntil > new Date() ? user.subscriptionUntil : new Date();
      const until = new Date(base.getTime() + this.periodDays[order.subPeriod] * 86_400_000);
      return () =>
        this.prisma.user.update({
          where: { id: order.userId },
          data: { subscriptionTier: order.subTier!, subscriptionUntil: until },
        });
    }
    // COIN_PURCHASE (default)
    return () =>
      this.prisma.user.update({
        where: { id: order.userId },
        data: { coinBalance: { increment: order.coins } },
      });
  }

  /** To'langan order bekor qilinganda tovarni qaytarib olish operatsiyasi (thunk). */
  private async buildRevertOp(order: Order): Promise<() => Prisma.PrismaPromise<unknown>> {
    if (order.type === 'SUBSCRIPTION' && order.subPeriod) {
      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
        select: { subscriptionUntil: true },
      });
      const reverted = user?.subscriptionUntil
        ? new Date(user.subscriptionUntil.getTime() - this.periodDays[order.subPeriod] * 86_400_000)
        : null;
      const stillActive = reverted && reverted > new Date();
      return () =>
        this.prisma.user.update({
          where: { id: order.userId },
          data: {
            subscriptionUntil: stillActive ? reverted : null,
            subscriptionTier: stillActive ? undefined : 'FREE',
          },
        });
    }
    return () =>
      this.prisma.user.update({
        where: { id: order.userId },
        data: { coinBalance: { decrement: order.coins } },
      });
  }

  // ─────────────── Checkout URL (frontend uchun) ───────────────

  /** Payme checkout manzilini yasaydi (GET usuli, base64 params). */
  async buildCheckoutUrl(orderId: string, amountTiyin: number, returnUrl?: string): Promise<string> {
    const { merchantId, checkoutUrl } = await this.paymeConfig.get();
    const parts = [`m=${merchantId}`, `ac.order_id=${orderId}`, `a=${amountTiyin}`, 'l=uz'];
    if (returnUrl) parts.push(`c=${returnUrl}`);
    const encoded = Buffer.from(parts.join(';'), 'utf8').toString('base64');
    return `${checkoutUrl}/${encoded}`;
  }
}
