# P10 — Premium sayqal, a11y, test, store assetlari

> Kontekst: `01_MASTER.md` §10 (wow ro'yxati), §8.4 (a11y/maxfiylik).

## Promt

```
Diydor'ni "wow"-darajaga ko'tar va relizga tayyorla. Manba: docs/flutter/01_MASTER.md §10. Hamma effekt MotionConfig orqali yoqib/o'chiriladi.

Vazifa:
1. Dark mode — barcha ekranni AMOLED-do'st dark'da tekshir va sayqalla (platinum-dark fon, gradient urg'u). Theme toggle (Settings) + tizim rejimini kuzatish.
2. Glassmorphism — AppBar, paywall, chiplar, bottom-nav: BackdropFilter blur + yarim shaffof (tokenlar). Performansni tekshir (blur og'ir bo'lsa motion orqali o'chsa bo'lsin).
3. Haptics — svayp (selection, masofaga bog'liq), match (heavy), like (medium), tugma (light), xato (vibrate). motion.global.hapticsEnabled.
4. Mikro-animatsiya (flutter_animate) — ro'yxatlar stagger fadeInUp, badge pulse, tugma shimmer, sahifa elementlari kirishi. motion dan.
5. Lottie — match (ixtiyoriy), sovg'a (chatda), bo'sh holatlar; assetlar + remote URL (motion.gifts/match.lottieUrl).
6. Skeleton shimmer — har yuklanishda (karta/inbox/profil/likes).
7. Sahifa o'tishlari — motion.transitions (sharedAxis/cupertino) silliq.
8. A11y — semantics labellar, kontrast (WCAG AA), touch target ≥44, matn shkalasi (textScaler) buzilmaydi, reducedMotion to'liq hurmat qilinadi, VoiceOver/TalkBack sinovi.
9. Test — widget testlar (DiydorButton, SwipeCard threshold, MotionConfig), golden testlar (asosiy ekranlar light+dark), integration test (onboarding→discover→match smoke).
10. Performans — image cache, const widgetlar, 60/120fps svayp (DevTools), app start vaqti.
11. Store assetlari — ikonka (adaptive Android + iOS), splash (flutter_native_splash), skrinshotlar (asosiy 5 ekran), store matnlari (o'zbek/rus), App Store Connect / Play Console metadata.

Acceptance:
- Light+dark ikkala rejimda barcha ekran sayqallangan.
- Haptics + mikro-animatsiya + Lottie ishlaydi, hammasi motion orqali o'chiriladigan.
- A11y AA; reducedMotion to'liq; VoiceOver/TalkBack o'qiydi.
- Testlar o'tadi; svayp 60fps.
- Store'ga yuklashga tayyor (ikonka/splash/skrinshot/metadata).
```

---

## Yakuniy reliz cheklist (qo'lda)

- [ ] iOS: tanga/obuna IAP orqali (Payme tugmasi mobil'da YO'Q) — Apple 3.1.1.
- [ ] Android: Play Billing; Payme faqat web.
- [ ] Hisobni o'chirish ishlaydi (DELETE /users/me).
- [ ] EULA/zero-tolerance rozilik; Report+Block.
- [ ] 18+ gate; yosh reytingi 17+/18+.
- [ ] Usage description matnlari (o'zbek); ruxsatlar kontekstli.
- [ ] Privacy nutrition label / Data safety form to'ldirilgan.
- [ ] Push (FCM/APNs) + deep-link.
- [ ] Legal sahifalar (yurist ko'rigidan o'tgan) ilovada.
- [ ] Backend: /iap/verify, DELETE /users/me, /config/public motion bloki tayyor.
```
