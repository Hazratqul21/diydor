import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const gifts = [
    {
      key: 'rose',
      name: 'Qizil Atirgul',
      imageUrl: '/gifts/rose.jpg',
      priceCoins: 20,
      cashoutSom: 1500, // Yuboruvchi 20 tanga sarflaydi, Oluvchi 1500 so'm oladi
      sortOrder: 1,
    },
    {
      key: 'ring',
      name: 'Olmos Uzuk',
      imageUrl: '/gifts/ring.jpg',
      priceCoins: 200,
      cashoutSom: 16000,
      sortOrder: 2,
    },
  ];

  console.log('Sovg\'alar qo\'shilmoqda...');
  for (const gift of gifts) {
    await prisma.giftItem.upsert({
      where: { key: gift.key },
      update: gift,
      create: gift,
    });
  }
  console.log('Sovg\'alar muvaffaqiyatli kiritildi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
