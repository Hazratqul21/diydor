import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ModerationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_PHOTOS = 6;
const VERIFY_URL = process.env.VERIFY_URL || 'http://localhost:8000';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  /**
   * Rasmni NSFW moderatsiyadan o'tkazadi (verify servis /moderate).
   * Servis o'chiq yoki xato bo'lsa — ruxsat (false-positive bloklamaslik uchun).
   * @returns true = ruxsat, false = nomaqbul (NSFW)
   */
  private async moderate(buffer: Buffer): Promise<boolean> {
    try {
      const fd = new FormData();
      fd.append('file', new Blob([new Uint8Array(buffer)]), 'photo.jpg');
      const res = await fetch(`${VERIFY_URL}/moderate`, { method: 'POST', body: fd as any });
      if (!res.ok) return true;
      const data = (await res.json()) as { allowed?: boolean };
      return data.allowed !== false;
    } catch {
      return true; // moderatsiya xizmati ishlamasa — bloklamaymiz
    }
  }

  /** base64 data URL (data:image/jpeg;base64,...) ni diskka saqlaydi va Photo yaratadi. */
  async addPhoto(userId: string, dataUrl: string) {
    const count = await this.prisma.photo.count({ where: { userId } });
    if (count >= MAX_PHOTOS) {
      throw new BadRequestException(`Maksimum ${MAX_PHOTOS} ta rasm`);
    }

    const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl);
    if (!match) {
      throw new BadRequestException('Rasm formati xato (data URL kutilyapti)');
    }
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const buffer = Buffer.from(match[3], 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) {
      throw new BadRequestException('Rasm hajmi 8MB dan oshmasin');
    }

    // NSFW moderatsiya — nomaqbul rasm saqlanmaydi
    const allowed = await this.moderate(buffer);
    if (!allowed) {
      throw new BadRequestException('Rasm nomaqbul deb topildi. Iltimos, boshqa surat tanlang.');
    }

    const fileName = `${randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);

    const photo = await this.prisma.photo.create({
      data: {
        userId,
        url: `/uploads/${fileName}`,
        order: count,
        moderationStatus: ModerationStatus.APPROVED,
      },
    });

    // Birinchi rasm yuklansa onboarding'ni oldinga suramiz
    await this.prisma.user.updateMany({
      where: { id: userId, onboardingStep: 'PHOTOS' },
      data: { onboardingStep: 'VERIFY' },
    });

    return photo;
  }

  async listMine(userId: string) {
    return this.prisma.photo.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async remove(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId) {
      throw new NotFoundException('Rasm topilmadi');
    }
    const filePath = path.join(UPLOAD_DIR, path.basename(photo.url));
    fs.rm(filePath, () => undefined);
    await this.prisma.photo.delete({ where: { id: photoId } });
    return { ok: true };
  }
}
