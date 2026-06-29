/**
 * Diydor yuridik hujjatlari (o'zbek tilida).
 * Buyurtmachi: INNASOFT MChJ. Bu shablon matn — yakuniy nashrdan oldin
 * yurist ko'rigidan o'tkazilishi tavsiya etiladi.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  slug: 'privacy' | 'terms' | 'offer';
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const COMPANY = 'INNASOFT MChJ';
const APP = 'Diydor';
const SUPPORT_EMAIL = 'support@diydor.uz';
const UPDATED = '2026-yil 25-iyun';

export const LEGAL_DOCS: Record<LegalDoc['slug'], LegalDoc> = {
  privacy: {
    slug: 'privacy',
    title: 'Maxfiylik siyosati',
    updated: UPDATED,
    intro: `${APP} ilovasi (${COMPANY}) sizning shaxsiy ma'lumotlaringiz xavfsizligini hurmat qiladi. Ushbu Maxfiylik siyosati biz qanday ma'lumotlarni yig'ishimiz, ulardan qanday foydalanishimiz va ularni qanday himoya qilishimizni tushuntiradi.`,
    sections: [
      {
        heading: '1. Qanday ma\'lumotlarni yig\'amiz',
        paragraphs: [
          'Profil ma\'lumotlari: ism, jins, tug\'ilgan sana (yoshni hisoblash uchun), qidiruv afzalligi, "o\'zim haqimda" matni, qiziqishlar va siz yuklagan suratlar.',
          'Verifikatsiya ma\'lumotlari: shaxsingizni tasdiqlash uchun selfi tasviri. Bu tasvir faqat yuz mavjudligini tekshirish uchun ishlatiladi.',
          'Texnik ma\'lumotlar: qurilma turi, taxminiy joylashuv (shahar darajasida, agar siz ko\'rsatsangiz) va ilovadan foydalanish statistikasi.',
          'To\'lov ma\'lumotlari: tanga sotib olish va pul yechishda to\'lovlar litsenziyalangan to\'lov tizimlari (masalan, Payme) orqali amalga oshiriladi. Biz to\'liq karta raqamingizni saqlamaymiz.',
        ],
      },
      {
        heading: '2. Ma\'lumotlardan qanday foydalanamiz',
        paragraphs: [
          'Sizga mos suhbatdoshlarni ko\'rsatish va tanishuv xizmatini taqdim etish uchun.',
          'Soxta va xavfli profillardan himoyalanish, xavfsizlikni ta\'minlash uchun.',
          'To\'lovlarni amalga oshirish va sovg\'alar tizimini ishlatish uchun.',
          'Xizmatni yaxshilash va texnik nosozliklarni bartaraf etish uchun.',
        ],
      },
      {
        heading: '3. Ma\'lumotlarni uchinchi tomonlarga berish',
        paragraphs: [
          'Biz sizning shaxsiy ma\'lumotlaringizni sotmaymiz. Ma\'lumotlar faqat quyidagi hollarda ulashiladi: to\'lovni amalga oshirish uchun litsenziyalangan to\'lov tizimlari bilan; qonun talab qilgan hollarda vakolatli davlat organlari bilan.',
          'Boshqa foydalanuvchilar sizning faqat ochiq profil ma\'lumotlaringizni (ism, yosh, suratlar, qiziqishlar, shahar) ko\'radi. Tug\'ilgan sanangiz, aniq joylashuvingiz, telefon raqamingiz va moliyaviy ma\'lumotlaringiz boshqalarga ko\'rinmaydi.',
        ],
      },
      {
        heading: '4. Ma\'lumotlarni saqlash va himoya',
        paragraphs: [
          'Ma\'lumotlaringiz himoyalangan serverlarda saqlanadi. Parollar va maxfiy ma\'lumotlar shifrlangan holda saqlanadi.',
          'Hisobingizni o\'chirganingizda, profil ma\'lumotlaringiz qonun talab qiladigan muddatdan tashqari hollarda o\'chiriladi.',
        ],
      },
      {
        heading: '5. Sizning huquqlaringiz',
        paragraphs: [
          'Siz istalgan vaqtda profilingizni tahrirlash, ma\'lumotlaringizni yuklab olish yoki hisobingizni o\'chirishni so\'rashingiz mumkin.',
          `Murojaat uchun: ${SUPPORT_EMAIL}.`,
        ],
      },
      {
        heading: '6. Yosh chegarasi',
        paragraphs: [
          `${APP} faqat 18 yoshdan katta foydalanuvchilar uchun. 18 yoshga to'lmagan shaxslarning ro'yxatdan o'tishi taqiqlanadi.`,
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Foydalanish shartlari',
    updated: UPDATED,
    intro: `Ushbu Foydalanish shartlari ${APP} ilovasidan (${COMPANY}) foydalanish qoidalarini belgilaydi. Ilovadan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.`,
    sections: [
      {
        heading: '1. Umumiy qoidalar',
        paragraphs: [
          `${APP} — odamlarga tanishish va muloqot qilish imkonini beruvchi platforma.`,
          'Ilovadan foydalanish uchun siz kamida 18 yoshda bo\'lishingiz va to\'g\'ri ma\'lumotlar taqdim etishingiz kerak.',
        ],
      },
      {
        heading: '2. Hisob va xavfsizlik',
        paragraphs: [
          'Siz o\'z hisobingiz xavfsizligi uchun javobgarsiz. Boshqa shaxs nomidan soxta profil yaratish taqiqlanadi.',
          'Verifikatsiyadan o\'tish xavfsizlikni oshiradi, biroq u har bir foydalanuvchining niyatini kafolatlamaydi — ehtiyot bo\'ling.',
        ],
      },
      {
        heading: '3. Foydalanuvchi xulqi',
        paragraphs: [
          'Taqiqlanadi: haqorat, tahdid, zo\'ravonlik, firibgarlik, spam, boshqa shaxslarning huquqlarini buzish, noqonuniy yoki axloqsiz kontent joylash.',
          'Taqiqlanadi: voyaga yetmaganlarga oid kontent, soxta ma\'lumotlar, boshqa foydalanuvchilarni aldash yoki ulardan pul undirish.',
          'Bunday qoidabuzarliklar hisobni bloklash yoki o\'chirishga olib keladi.',
        ],
      },
      {
        heading: '4. Kontent',
        paragraphs: [
          'Siz yuklagan suratlar va matnlar sizga tegishli. Biroq siz bizga ularni ilova ichida ko\'rsatish uchun ruxsat berasiz.',
          'Biz qoidalarga zid kontentni ogohlantirishsiz o\'chirish huquqini saqlab qolamiz.',
        ],
      },
      {
        heading: '5. To\'lovlar va tangalar',
        paragraphs: [
          '"Yurak tangalari" — ilova ichidagi virtual birlik bo\'lib, sovg\'a yuborish kabi funksiyalar uchun ishlatiladi.',
          'Tangalar va sovg\'alar bo\'yicha batafsil shartlar Ommaviy ofertada keltirilgan.',
        ],
      },
      {
        heading: '6. Javobgarlikni cheklash',
        paragraphs: [
          `${COMPANY} foydalanuvchilar o'rtasidagi muloqot yoki uchrashuvlar natijasida yuzaga keladigan zararlar uchun javobgar emas.`,
          'Xizmat "boricha" taqdim etiladi. Biz uzluksiz ishlashni kafolatlamaymiz, ammo sifatni oshirishga harakat qilamiz.',
        ],
      },
      {
        heading: '7. Shartlarga o\'zgartirish',
        paragraphs: [
          'Biz ushbu shartlarni yangilashimiz mumkin. Muhim o\'zgarishlar haqida ilova orqali xabar beramiz.',
          `Savollar uchun: ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },

  offer: {
    slug: 'offer',
    title: 'Ommaviy oferta',
    updated: UPDATED,
    intro: `Ushbu Ommaviy oferta ${COMPANY} (bundan keyin — "Ijrochi") va ${APP} ilovasi foydalanuvchisi (bundan keyin — "Foydalanuvchi") o'rtasida pulli xizmatlar ko'rsatish bo'yicha rasmiy taklif hisoblanadi. To'lovni amalga oshirish orqali Foydalanuvchi ushbu oferta shartlarini to'liq qabul qiladi (akseptlaydi).`,
    sections: [
      {
        heading: '1. Oferta predmeti',
        paragraphs: [
          'Ijrochi Foydalanuvchiga ilova ichidagi raqamli mahsulotlarni ("Yurak tangalari", sovg\'alar, premium funksiyalar) taqdim etadi.',
          'Tangalar — qaytarib bo\'lmaydigan ichki virtual birlik bo\'lib, faqat ilova ichida ishlatiladi.',
        ],
      },
      {
        heading: '2. Narx va to\'lov tartibi',
        paragraphs: [
          'Mahsulotlar narxi ilovaning "Tanga sotib olish" bo\'limida ko\'rsatiladi va O\'zbekiston so\'mida belgilanadi.',
          'To\'lovlar litsenziyalangan to\'lov tizimlari (masalan, Payme) orqali amalga oshiriladi. To\'lov muvaffaqiyatli o\'tgach, tangalar avtomatik ravishda hisobingizga qo\'shiladi.',
        ],
      },
      {
        heading: '3. Sovg\'alar va pul yechish',
        paragraphs: [
          'Foydalanuvchi olgan real sovg\'alar qiymatining bir qismi uning ichki hisobiga (hamyon) so\'mda yig\'iladi.',
          'Yig\'ilgan mablag\'ni yechish litsenziyalangan to\'lov tizimi orqali, belgilangan minimal summadan boshlab amalga oshiriladi. Katta summalar uchun shaxsni tasdiqlash (KYC) talab qilinishi mumkin.',
        ],
      },
      {
        heading: '4. Pul qaytarish siyosati',
        paragraphs: [
          'Raqamli mahsulotlar (tangalar) sotib olingach va ishlatilgach, ular qaytarilmaydi.',
          'Texnik xatolik tufayli tanga hisobga qo\'shilmagan bo\'lsa, Foydalanuvchi qo\'llab-quvvatlash xizmatiga murojaat qilishi mumkin va masala 7 ish kuni ichida ko\'rib chiqiladi.',
        ],
      },
      {
        heading: '5. Tomonlarning javobgarligi',
        paragraphs: [
          'Ijrochi xizmatni sifatli taqdim etishga harakat qiladi, biroq internet yoki uchinchi tomon to\'lov tizimlaridagi uzilishlar uchun javobgar emas.',
          'Foydalanuvchi to\'lov uchun o\'zi taqdim etgan ma\'lumotlar to\'g\'riligi uchun javobgardir.',
        ],
      },
      {
        heading: '6. Rekvizitlar va aloqa',
        paragraphs: [
          `Ijrochi: ${COMPANY}.`,
          `Aloqa: ${SUPPORT_EMAIL}.`,
          'To\'liq rekvizitlar (STIR, hisob raqami) talab bo\'yicha taqdim etiladi.',
        ],
      },
    ],
  },
};

export const LEGAL_LINKS: { slug: LegalDoc['slug']; title: string }[] = [
  { slug: 'terms', title: 'Foydalanish shartlari' },
  { slug: 'privacy', title: 'Maxfiylik siyosati' },
  { slug: 'offer', title: 'Ommaviy oferta' },
];
