import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { serializeUser } from '../common/serialize-user';
import { ChatGateway } from './chat.gateway';
import { TelegramNotifyService } from '../notifications/telegram-notify.service';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'chat');

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly telegram: TelegramNotifyService,
  ) {}

  /**
   * Qabul qiluvchi online bo'lmasa Telegram push yuboradi (re-engagement).
   * Socket orqali allaqachon xabar berilgan bo'ladi.
   */
  private async pushIfOffline(recipientId: string, senderId: string, kind: 'text' | 'image' | 'gift') {
    if (await this.chatGateway.isOnline(recipientId)) return;
    // Oluvchining maxfiylik sozlamasi: yuboruvchi ismi ko'rsatilsinmi?
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { notifyShowSender: true },
    });
    let name = 'Kimdir';
    if (recipient?.notifyShowSender) {
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true },
      });
      name = sender?.firstName ?? 'Kimdir';
    }
    // Yashirin rejim (standart): ism ko'rsatilmaydi
    const body = recipient?.notifyShowSender
      ? kind === 'image'
        ? `📷 <b>${name}</b> sizga rasm yubordi`
        : kind === 'gift'
          ? `🎁 <b>${name}</b> sizga sovg'a yubordi`
          : `💬 <b>${name}</b> sizga yangi xabar yubordi`
      : kind === 'image'
        ? `📷 Sizga yangi rasm bor`
        : kind === 'gift'
          ? `🎁 Sizga yangi sovg'a bor`
          : `💬 Sizga yangi xabar bor`;
    await this.telegram.sendToUser(recipientId, body);
  }

  /** Mening barcha match'larim — oxirgi xabar + o'qilmaganlar soni bilan. */
  async listMatches(meId: string) {
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ userAId: meId }, { userBId: meId }], closedAt: null },
      include: {
        userA: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } },
        userB: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: any[] = [];
    for (const m of matches) {
      const other = m.userAId === meId ? m.userB : m.userA;
      const unread = await this.prisma.message.count({
        where: { matchId: m.id, senderId: { not: meId }, readAt: null },
      });
      result.push({
        matchId: m.id,
        createdAt: m.createdAt,
        user: serializeUser(other),
        lastMessage: m.messages[0] ?? null,
        unread,
      });
    }
    return result;
  }

  private async assertMember(matchId: string, meId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match topilmadi');
    if (match.userAId !== meId && match.userBId !== meId) {
      throw new ForbiddenException('Bu suhbat sizniki emas');
    }
    return match;
  }

  async getMessages(meId: string, matchId: string) {
    const match = await this.assertMember(matchId, meId);
    const otherId = match.userAId === meId ? match.userBId : match.userAId;

    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });

    // Kelgan xabarlarni o'qilgan deb belgilaymiz
    await this.prisma.message.updateMany({
      where: { matchId, senderId: otherId, readAt: null },
      data: { readAt: new Date() },
    });

    const other = await this.prisma.user.findUnique({
      where: { id: otherId },
      include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
    });

    const online = await this.chatGateway.isOnline(otherId);
    return { match: { id: matchId }, user: serializeUser(other), online, messages };
  }

  async sendMessage(meId: string, matchId: string, content: string, type: MessageType = 'TEXT') {
    const match = await this.assertMember(matchId, meId);
    // TODO: AI moderatsiya (tahqir/tahdid/kontakt almashinuvi)
    const msg = await this.prisma.message.create({
      data: { matchId, senderId: meId, content, type },
    });

    // Notify the other user via WebSocket
    const recipientId = match.userAId === meId ? match.userBId : match.userAId;
    this.chatGateway.notifyNewMessage(recipientId, msg);
    void this.pushIfOffline(recipientId, meId, 'text');

    return msg;
  }

  /** Chatда rasm yuborish: base64 data URL -> diskka saqlanadi -> IMAGE xabar. */
  async sendImage(meId: string, matchId: string, dataUrl: string) {
    const match = await this.assertMember(matchId, meId);

    const m = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl);
    if (!m) throw new BadRequestException('Rasm formati xato');
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const buffer = Buffer.from(m[3], 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) throw new BadRequestException('Rasm hajmi 8MB dan oshmasin');

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const fileName = `${randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);
    const url = `/uploads/chat/${fileName}`;

    const msg = await this.prisma.message.create({
      data: { matchId, senderId: meId, content: url, type: 'IMAGE' },
    });
    const recipientId = match.userAId === meId ? match.userBId : match.userAId;
    this.chatGateway.notifyNewMessage(recipientId, msg);
    void this.pushIfOffline(recipientId, meId, 'image');
    return msg;
  }
}
