import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Shikoyat yaratish (admin ko'rib chiqadi). */
  async report(reporterId: string, reportedId: string, reason: string, details?: string) {
    if (reporterId === reportedId) throw new BadRequestException("O'zingizni shikoyat qila olmaysiz");
    const target = await this.prisma.user.findUnique({ where: { id: reportedId }, select: { id: true } });
    if (!target) throw new BadRequestException('Foydalanuvchi topilmadi');
    await this.prisma.report.create({ data: { reporterId, reportedId, reason, details: details ?? null } });
    return { ok: true };
  }

  /** Bloklash: yozuv yaratiladi va ular orasidagi match yopiladi (suhbatdan yo'qoladi). */
  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException("O'zingizni bloklay olmaysiz");
    const target = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) throw new BadRequestException('Foydalanuvchi topilmadi');

    const [userAId, userBId] = [blockerId, blockedId].sort();
    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      }),
      // Ular orasidagi match'ni yopamiz (ikkalasi uchun ham suhbatdan chiqadi)
      this.prisma.match.updateMany({
        where: { userAId, userBId },
        data: { closedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    return { ok: true };
  }

  /** Men bloklagan foydalanuvchilar ro'yxati. */
  async listBlocked(meId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: meId },
      include: {
        blocked: { select: { id: true, firstName: true, photos: { orderBy: { order: 'asc' }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return blocks.map((b) => ({
      id: b.blocked.id,
      firstName: b.blocked.firstName,
      photoUrl: b.blocked.photos[0]?.url ?? null,
      blockedAt: b.createdAt,
    }));
  }
}
