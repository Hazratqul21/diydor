# P04 — Onboarding (Welcome → Verified)

> Kontekst: `01_MASTER.md` §2 (ekranlar), §4 (dizayn), §6 (fadeInUp/spring), §8 (kamera ruxsati).

## Promt

```
Diydor onboarding oqimini qur (7 ekran). Manba: docs/flutter/01_MASTER.md. Hamma matn O'ZBEK. Token+MotionConfig'dan foydalanil (raw qiymat yo'q).

Ekranlar va talablar:
1. Welcome (/) — splash: heartbeat logo (motion.splash, minDurationMs), hero rasm = AppPublicConfig.welcomeImageUrl (fallback default), title/subtitle config'dan, ken-burns (motion.heroImage). Boot-gate: P03 router redirect (mavjud sessiyani to'g'ri joyga). "Boshlash" → ensureGuestSession → routeForStep. Pastda Legal linklar (/legal/terms, /legal/privacy). fadeInUp stagger (delay 0/0.1/0.2).
2. Gender (/onboarding/gender) — jins (Erkak/Ayol) + qidirilayotgan jins (Erkak/Ayol/Hammasi → MALE/FEMALE/EVERYONE). PATCH /users/me. Skip YO'Q (majburiy).
3. Age (/onboarding/age) — tug'ilgan sana (date picker), 18+ validatsiya ("Siz X yoshdasiz" / "18 dan kichik bo'lib bo'lmaydi"). PATCH birthDate.
4. Intent (/onboarding/intent) — maqsad tanlovi (kartalar). PATCH intent.
5. Photos (/onboarding/photos) — rasm grid (max N), image_picker + flutter_image_compress → base64 → POST /photos. Kamida 1 rasm majburiy.
6. Selfie (/onboarding/verify) — camera paketi (old kamera), oval ramka, "Yuzingizni ramkaga joylang", suratga ol → POST /users/me/verify. Kamera ruxsati permission_handler bilan kontekstli so'raladi. Verifikatsiya muvaffaqiyatsiz → qayta urinish.
7. Verified (/onboarding/done) — springIn tasdiq, "Discover'ga o'tish".
- Yagona OnboardingHeader: segmentli progress (qadam X/5), orqaga tugma. (React'da yagona manba edi — saqlanadi.)

Acceptance:
- Har bosqich backend'ga saqlanadi; orqaga/oldinga to'g'ri ishlaydi.
- 18+ validatsiya ishlaydi; majburiy maydonlarda Skip yo'q.
- fadeInUp/springIn motion.* dan; reducedMotion'da darhol ko'rinadi.
- Kamera ruxsati rad etilsa — tushuntirish + Settings'ga yo'naltirish.
```
