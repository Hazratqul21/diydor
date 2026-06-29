/**
 * DEV fikstura (faqat lokal sinov uchun) — seed.ts dan ALOHIDA.
 * Demo userlarni yaratadi va (argv[2]=meId berilsa) o'sha user uchun
 * match + namuna xabarlar qo'shadi.
 *   ishlatish: npx ts-node prisma/dev-fixtures.ts [meId]
 */
import { PrismaClient, Gender, SeekingGender, Intent } from '@prisma/client';

const prisma = new PrismaClient();

const IMG = {
  f1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMV4uyP8WNdj1hcj2m7d52P-AoW-b3FXg2Pmm_RUNRvunE2d8jdvR10o2A3DucLMdDPOKuvuU6Z7rvOk_FzaBHf2EXJkVP1Od6I_hvDtzWlH-em8lNd_zvfAZXtfrBPgV2mAExpv5tSH5Lj_PPIz3Rcmf-V11oyqEVhgnb6XnMp03xi34PhaZyisHaTrmvJ2PT9jecQMs4baKCIlwJKi85U1qMVlEDpvmfGyuNPDAWMKTu6DPX1KfKjvY-eWWjmAKcBWtSenLirCk',
  f2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7FSh8uqBNhrDuHAteoLZ4gkxVcaG7Mb-SBKNS7mHxttHTrqLNLf91Lrg0-ahJfWaS0-dIl6YtJxHxlwS27jMy7_75aG6k5NMZVj77OtSskwd0mEHv8TlQsSFiOIydocqJh3cC5IK5wHh8NHoDCaHRDuLa46IkJbuJdbZWxsizKeWG7Ty91phyklXir3lnwpGEc7NeeC4b8FK9lbjCcygerNlGxlyol1KMZZ3xoTnGlWA4a_0HPRA7J4pl88YVY0nbY93En7PLYZ0',
  f3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAkHiV_KNf7Z3UVSZlJMqesIgtNqQ-JGtRTPf6B6h3-7ghs-91_IvRUHRxgGnSGhBlz9qESrmLDfl6TU7n_FGtHuXBCTC2YGB5_8J6XlfMJA9tdrhYRLik6BTAzjlgWCqZT98R4vWvsiLlLs6L9nqxC9YSnNbZpRcUyJPoBQg4lT4_lM88xnFVSiNWJHyGcF1-f4lK33kF2mMCGOcig3VOHJrupdLrrOs1maKnRYIWervVet1s8J_d-95CvPdO2BxOTfsdOIfTqWE',
  m1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCurMyE15BbsDSWewmuTPerepcIq79jfD7UteKMMa-jBJffio0SFT27eBYYR6DE3DPYQecoU5LpcpqLuZQJJ8_ax4OqZxUbaM4l8QvCQRpeGgU9OMtDg6B6tqXHBikbfrv5ysCtgh9amjw77JtR8eSMC4U97aDBfJEtQ7Bt7Nrm1AnTdmkp5RnqnG6zaoI3Fhgn2V6qHc0jjSmrPOe8K17v-7e8feuwRGdydzKuAr6RNqjinbF7S3yzzSQtltKpARmHylAN8B-_pp4',
  m2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrhDC8tfijavapaXkmz56f3aY13xOKknMCJUbg6OqCGde9B3PR2B_nv93J2FOM_OngC3ZSfhSnsZqQ1I7XsxF811G9-rswNzOcMHMDvO0Pdw7BSoo0GxglR1BLlPFwLTZgOYYVy2cLHrhcAg3btKOlf5gA-N1MbzmQnc4hVWLiFuy9jegVSRuhi_3UqizW8RXPEBnbIkMzIP9HGKtagm0b_YOCDN4kMH6DwzHF_yh_qBV6PCg9NJ-ha35qGs7yzXAz-7NiczzvJco',
};

const DEMO = [
  { username: 'demo_madina', firstName: 'Madina', gender: 'FEMALE', seekingGender: 'MALE', age: 24, intent: 'SERIOUS', bio: 'Sayohat va qahva ishqibozi.', interests: ['Qahva', "San'at", 'Sayohat'], photos: [IMG.f1] },
  { username: 'demo_malika', firstName: 'Malika', gender: 'FEMALE', seekingGender: 'EVERYONE', age: 24, intent: 'SERIOUS', bio: "Kitob va qahvaxona.", interests: ['Sayohat', 'Kofe', 'Kitoblar'], photos: [IMG.f2, IMG.f3] },
  { username: 'demo_nigora', firstName: 'Nigora', gender: 'FEMALE', seekingGender: 'MALE', age: 26, intent: 'FRIENDSHIP', bio: 'Musiqa va tabiat.', interests: ['Musiqa', 'Tabiat'], photos: [IMG.f3] },
  { username: 'demo_aziz', firstName: 'Aziz', gender: 'MALE', seekingGender: 'FEMALE', age: 27, intent: 'SERIOUS', bio: 'IT sohasidaman.', interests: ['Sport', 'Sayohat'], photos: [IMG.m1] },
  { username: 'demo_jamshid', firstName: 'Jamshid', gender: 'MALE', seekingGender: 'FEMALE', age: 28, intent: 'SERIOUS', bio: 'Tadbirkor.', interests: ['Biznes', 'Qahva'], photos: [IMG.m2] },
];

function birthFromAge(age: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d;
}

async function main() {
  const meId = process.argv[2];

  for (const d of DEMO) {
    const existing = await prisma.user.findFirst({ where: { username: d.username } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        username: d.username,
        firstName: d.firstName,
        gender: d.gender as Gender,
        seekingGender: d.seekingGender as SeekingGender,
        birthDate: birthFromAge(d.age),
        intent: d.intent as Intent,
        bio: d.bio,
        interests: d.interests,
        city: 'Toshkent',
        latitude: 41.31,
        longitude: 69.24,
        isVerified: true,
        trustScore: 80,
        onboardingStep: 'DONE',
        photos: { create: d.photos.map((url, i) => ({ url, order: i, moderationStatus: 'APPROVED' })) },
      },
    });
  }
  console.log('✓ Demo userlar tayyor');

  if (meId) {
    const madina = await prisma.user.findFirst({ where: { username: 'demo_madina' } });
    if (madina) {
      const [a, b] = [meId, madina.id].sort();
      const match = await prisma.match.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: { userAId: a, userBId: b },
        update: { closedAt: null },
      });
      const count = await prisma.message.count({ where: { matchId: match.id } });
      if (count === 0) {
        await prisma.message.createMany({
          data: [
            { matchId: match.id, senderId: madina.id, content: "Salom! Profilingiz menga yoqdi 😊", createdAt: new Date(Date.now() - 600000) },
            { matchId: match.id, senderId: meId, content: 'Rahmat! Tanishganimdan xursandman.', createdAt: new Date(Date.now() - 300000) },
            { matchId: madina.id ? match.id : match.id, senderId: madina.id, content: 'Bo‘sh vaqtingizda qahvaga chiqamizmi? ☕️', createdAt: new Date(Date.now() - 60000) },
          ],
        });
      }
      console.log(`✓ Match + xabarlar yaratildi (matchId=${match.id})`);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
