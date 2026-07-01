import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingStep, Prisma } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { serializeUser } from '../common/serialize-user';

const MIN_AGE = 18;
const VERIFY_URL = process.env.VERIFY_URL || 'http://localhost:8000';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** To'liq profil (rasm va promptlar bilan) */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: { orderBy: { order: 'asc' } },
        prompts: { orderBy: { order: 'asc' } },
      },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return this.serialize(user);
  }

  /** Boshqa userning ochiq profili (svayp kartani bosganda / match'da). */
  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        photos: { where: { moderationStatus: 'APPROVED' }, orderBy: { order: 'asc' } },
        prompts: { orderBy: { order: 'asc' } },
      },
    });
    if (!user || user.isBanned) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    return serializeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.seekingGender !== undefined) data.seekingGender = dto.seekingGender;
    if (dto.intent !== undefined) data.intent = dto.intent;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.interests !== undefined) data.interests = dto.interests;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.notifyShowSender !== undefined) data.notifyShowSender = dto.notifyShowSender;

    if (dto.birthDate !== undefined) {
      const birth = new Date(dto.birthDate);
      const age = this.calcAge(birth);
      if (Number.isNaN(age)) {
        throw new BadRequestException('Tug\'ilgan sana noto\'g\'ri');
      }
      if (age < MIN_AGE) {
        throw new BadRequestException('Diydor faqat 18 yoshdan katta foydalanuvchilar uchun');
      }
      data.birthDate = birth;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    // Onboarding bosqichini avtomatik oldinga suramiz
    await this.maybeAdvanceOnboarding(updated.id);

    return this.getMe(userId);
  }

  /**
   * Akkauntni butunlay o'chiradi: rasm fayllari diskdan, so'ng user yozuvi
   * (bog'liq yozuvlar schema cascade orqali o'chadi).
   */
  async deleteAccount(userId: string) {
    const photos = await this.prisma.photo.findMany({
      where: { userId },
      select: { url: true },
    });
    for (const p of photos) {
      try {
        const fp = path.join(process.cwd(), p.url.replace(/^\//, ''));
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch {
        /* fayl o'chmasa ham davom etamiz */
      }
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }

  /**
   * Selfie verifikatsiya: FastAPI (MediaPipe) servisini chaqiradi
   */
  async verifySelfie(userId: string, file: Express.Multer.File) {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
      formData.append('file', blob, file.originalname);

      // Profil rasmi bilan face-match uchun birinchi rasmni reference qilamiz
      const ref = await this.prisma.photo.findFirst({
        where: { userId },
        orderBy: { order: 'asc' },
        select: { url: true },
      });
      if (ref?.url) {
        const refPath = path.join(process.cwd(), ref.url.replace(/^\//, ''));
        if (fs.existsSync(refPath)) {
          const refBuf = fs.readFileSync(refPath);
          formData.append('reference', new Blob([new Uint8Array(refBuf)]), 'reference.jpg');
        }
      }

      const response = await fetch(`${VERIFY_URL}/api/verify`, {
        method: 'POST',
        body: formData as any,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(errorData.detail || 'Verifikatsiya xizmatida xatolik');
      }

      const result = await response.json();
      
      if (result.verified) {
        return this.markVerified(userId);
      } else {
        throw new BadRequestException(result.message || 'Yuz aniqlanmadi');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Verifikatsiya xizmati ishlamayapti');
    }
  }

  /**
   * Verified maqomini saqlash
   */
  async markVerified(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, onboardingStep: OnboardingStep.DONE },
    });
    return this.getMe(userId);
  }

  /**
   * Joriy ma'lumotlarga qarab onboarding_step ni keyingi mantiqiy bosqichga suradi.
   * (Granular bosqich logikasi: rasm/verify/prompt modullari o'z bosqichini belgilaydi.)
   */
  private async maybeAdvanceOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { photos: true, prompts: true } } },
    });
    if (!user || user.onboardingStep === OnboardingStep.DONE) return;

    let step: OnboardingStep = user.onboardingStep;

    if (user.gender && user.birthDate && step === OnboardingStep.GENDER_AGE) {
      step = OnboardingStep.INTENT;
    }
    if (user.intent && step === OnboardingStep.INTENT) {
      step = OnboardingStep.PHOTOS;
    }

    if (step !== user.onboardingStep) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: step },
      });
    }
  }

  private calcAge(birth: Date): number {
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  /** BigInt (telegramId) JSON'da serializatsiya bo'lmaydi — string'ga aylantiramiz */
  private serialize(user: any) {
    return {
      ...user,
      telegramId: user.telegramId?.toString(),
      age: user.birthDate ? this.calcAge(new Date(user.birthDate)) : null,
    };
  }
}
