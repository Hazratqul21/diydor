# Diydor — Flutter Master Hujjat (Single Source of Truth)

> Bu hujjat Diydor ilovasini Flutter'da noldan, wow-darajada premium va do'kon-qonunlariga mos qurish uchun **to'liq texnik spetsifikatsiya**. Barcha modul-promtlari (`prompts/`) shu hujjatga tayanadi. O'zgartirish kiritsangiz — avval shu yerda o'zgartiring.

**Versiya:** 1.0 · **Sana:** 2026-06-29 · **Manba:** `~/Desktop/tanishuv_ilova` (React) → Flutter

---

## 1. Mahsulot haqida qisqacha

Diydor — O'zbekiston/MDH uchun tanishuv (dating) ilovasi. INNASOFT MChJ. Asosiy sikl (core loop):

```
Welcome → Onboarding (jins → yosh → maqsad → rasmlar → selfie verifikatsiya) →
Discover (svayp) → Match → Chat (+ sovg'a) → Monetizatsiya (obuna / tanga / hamyon)
```

**Til:** 100% o'zbek (lotin). **Auth:** mehmon (guest) sessiya yoki Telegram (mini-app), telefon keyin. **18+ majburiy.**

**Jins-to'lov mantig'i (mahsulot qarori):** erkaklar to'laydi, ayollar bepul premium. Bu mantiq backend'da bor va Flutter'da ham saqlanadi.

---

## 2. Ekranlar ro'yxati (21 ta) va route'lar

Mavjud React route jadvalidan 1:1 ko'chiriladi. go_router path'lari bir xil saqlanadi (deep-link va analitika uchun qulay):

| # | Ekran | Route | Tavsif |
|---|-------|-------|--------|
| 1 | Welcome / Splash | `/` | Heartbeat logo, hero rasm (admin branding), boot-gate (mavjud sessiyani to'g'ri ekranga yuboradi) |
| 2 | Gender | `/onboarding/gender` | Jins + qidirilayotgan jins (MALE/FEMALE/EVERYONE) |
| 3 | Age | `/onboarding/age` | Tug'ilgan sana, 18+ validatsiya |
| 4 | Intent | `/onboarding/intent` | Maqsad (jiddiy/do'stlik/...) |
| 5 | Photos | `/onboarding/photos` | Rasm grid yuklash |
| 6 | Selfie | `/onboarding/verify` | Kamera, liveness/face-match verifikatsiya |
| 7 | Verified | `/onboarding/done` | Tasdiqlandi ekrani |
| 8 | Discover | `/discover` | **Asosiy** — svayp kartalar, segmented (Siz uchun / Yaqin atrofda) |
| 9 | Likes | `/likes` | Sizni kim yoqtirdi (Gold paywall, ayollarga bepul) |
| 10 | Messages | `/messages` | Inbox |
| 11 | Chat | `/chat/:id` | Real-time chat, rasm, sovg'a |
| 12 | MyProfile | `/profile` | O'z profili, premium banner, tanga chip |
| 13 | EditProfile | `/profile/edit` | Bio/shahar/qiziqishlar |
| 14 | Subscription | `/subscription` | Plus/Gold/Platinum, davr toggle |
| 15 | ProfileDetail | `/u/:userId` | To'liq profil + foto karusel |
| 16 | Settings | `/settings` | Sozlamalar + hujjatlar + **hisobni o'chirish** |
| 17 | LegalPage | `/legal/:slug` | Maxfiylik/Shartlar/Oferta |
| 18 | GiftStore | `/gifts/:matchId` | Sovg'a do'koni |
| 19 | CoinStore | `/coins` | Tanga sotib olish |
| 20 | Wallet | `/wallet` | Hamyon |
| 21 | Withdraw | `/wallet/withdraw` | Pul yechish (karta, qo'lda) |

**Navigatsiya konteyneri:** pastki `BottomNav` (Discover / Likes / Messages / Profile). Onboarding va modal ekranlar nav'siz.

---

## 3. Texnik arxitektura (Flutter)

### 3.1 Stek va kutubxonalar (tasdiqlangan tanlovlar)

| Soha | Paket | Sabab |
|------|-------|-------|
| State | `flutter_riverpod` + `riverpod_generator` | Testlanadigan, kompilyatsiya-vaqt xavfsiz, global+lokal holat |
| Routing | `go_router` | Deklarativ, deep-link, redirect guard (auth/onboarding step) |
| Network | `dio` + `retrofit` + `json_serializable` | Interceptor (JWT, refresh, log), tip-xavfsiz API |
| Secure store | `flutter_secure_storage` | JWT token (`diydor_token`), iOS Keychain / Android Keystore |
| Local cache | `shared_preferences` + `hive` (ixtiyoriy) | Motion config kesh, oxirgi sessiya |
| Real-time | `socket_io_client` | Backend Socket.IO gateway bilan mos (chat, presence) |
| Rasm | `cached_network_image` + `flutter_image_compress` | Yuklash + upload siqish |
| Animatsiya | `flutter_animate`, `lottie`, `confetti` | Deklarativ mikro-anim, Lottie sovg'a, match konfetti |
| Haptics | `flutter` built-in `HapticFeedback` | Svayp/match/tugma tebranishi |
| Kamera | `camera` | Selfie verifikatsiya |
| To'lov | `in_app_purchase` (mobil IAP) + `webview_flutter` (Payme web) | Do'kon qoidalari (§9) |
| Push | `firebase_messaging` + `flutter_local_notifications` | Match/xabar push |
| Permissions | `permission_handler` | Kamera/bildirishnoma/joylashuv |
| Lokalizatsiya | `flutter_localizations` + `intl` (.arb) | 100% o'zbek, kelajakda ru/en |
| Env | `--dart-define` + `flutter_dotenv` (dev) | API URL, Sentry DSN |

### 3.2 Loyiha tuzilishi (feature-first, clean)

```
lib/
  main.dart                     # bootstrap: ProviderScope, theme, motion config preload
  app/
    app.dart                    # MaterialApp.router
    router.dart                 # go_router + redirect guard (auth/onboarding step)
    theme/
      app_theme.dart            # ThemeData (M3) tokenlardan
      app_colors.dart           # §4 ranglar
      app_typography.dart       # §4 type scale (Manrope)
      app_spacing.dart          # §4 spacing/radius/shadow
  core/
    network/
      dio_client.dart           # interceptor: JWT, error->ApiException(code)
      api_service.dart          # retrofit interfeysi
    storage/secure_store.dart
    motion/                     # §6 MOTION ENGINE
      motion_config.dart        # model (durations, curves, springs, toggles, lottie urls)
      motion_provider.dart      # remote fetch + cache + defaults
      motion.dart               # MotionConfig'ni o'qiydigan helper/extension
    socket/socket_service.dart
    error/api_exception.dart    # {status, code} — React ApiError bilan bir xil
  features/
    onboarding/  (welcome, gender, age, intent, photos, selfie, verified)
    discover/    (discover_page, swipe_card, action_buttons, match_overlay, paywall)
    likes/
    chat/        (messages_page, chat_page, gift_store)
    profile/     (my_profile, edit_profile, profile_detail)
    subscription/
    wallet/      (wallet, withdraw, coin_store)
    legal/
    settings/
  shared/
    widgets/     (DiydorButton, DiydorCard, BottomNav, ShimmerBox, EmptyState, AppBarBlur, InterestChip)
    models/      (User, Profile, Photo, Match, Message, Gift, Plan, AppConfig)
    utils/       (time, formatters, interest_icons)
```

### 3.3 Auth/onboarding redirect guard (kritik mantiq)

React'da topilgan bug (Welcome har doim onboarding'ga yuborardi → ro'yxatdan o'tgan user qayta o'tardi) Flutter'da go_router `redirect` bilan to'g'ri qilinadi:

- Boot'da: token bor? → `GET /users/me` → `onboardingStep` ni o'qib to'g'ri route'ga `redirect`.
- `STEP_ROUTE` map (React `auth.ts` dan): `GENDER_AGE→/onboarding/gender`, `INTENT→/onboarding/intent`, `PHOTOS→/onboarding/photos`, `VERIFY→/onboarding/verify`, `PROMPTS|PERMISSIONS|DONE→/discover`.
- Token yaroqsiz → tozalash → `/`.
- Guest sessiya FAQAT "Boshlash" bosilganda yaratiladi (avtomatik emas).

---

## 4. Dizayn tizimi (Design System)

> Manba: `apps/mobile/tailwind.config.js` (Material 3, Stitch'dan). Flutter'ga 1:1 ko'chiriladi va tokenga aylantiriladi. Aniq qiymatlar `03_DESIGN_TOKENS.json` da.

### 4.1 Ranglar (light)

| Token | HEX | Ishlatilishi |
|-------|-----|--------------|
| `primary` | `#A73833` | Asosiy brend (coral-qizil), CTA, ❤️ tugma |
| `coral-deep` | `#E86358` | Gradient/urg'u |
| `primary-container` | `#FF7A70` | Yumshoq urg'u fon |
| `on-primary` | `#FFFFFF` | Primary ustidagi matn |
| `on-primary-container` | `#721112` | |
| `surface` / `background` | `#FCF8FB` | Asosiy fon |
| `surface-warm` | `#FFFFFF` | Karta foni |
| `surface-subtle` | `#F2F2F7` | Segmented track |
| `surface-container*` | `#FFFFFF`…`#E4E2E4` | Yuzalar darajasi (lowest→highest) |
| `on-surface` | `#1B1B1D` | Asosiy matn |
| `on-surface-variant` | `#57423F` | Ikkilamchi matn |
| `outline` / `outline-variant` | `#8B716E` / `#DEC0BC` | Chegaralar |
| `tertiary` | `#005BC1` | SuperLike (ko'k) |
| `success` / `success-container` | `#34C759` / `#E5F9E9` | "YOQDI", tasdiq |
| `error` / `error-container` | `#BA1A1A` / `#FFDAD6` | "KEYINGI", xato |
| `platinum-dark` | `#121212` | Platinum obuna |

**Dark mode:** `darkMode: class` bor. Flutter'da `ColorScheme.dark` to'liq M3 invert qilinadi (token JSON'da `dark` bloki). Wow-versiya uchun dark mode birinchi-darajali (premium tanishuv ilovalar ko'pincha dark).

### 4.2 Tipografika (Manrope)

`google_fonts` yoki paketga qo'shilgan Manrope. Type scale (Flutter `TextTheme` ga map):

| Token | Size/LH | Weight | LS |
|-------|---------|--------|-----|
| `headline-lg` | 34/41 | 700 | -0.02em |
| `headline-lg-mobile` | 28/34 | 700 | -0.01em |
| `headline-md` | 22/28 | 600 | 0 |
| `body-lg` | 17/22 | 400 | 0 |
| `body-md` | 15/20 | 400 | 0 |
| `label-sm` | 13/18 | 500 | 0 |
| `label-caps` | 12/16 | 600 | 0.05em (uppercase) |

### 4.3 Spacing / Radius / Shadow

- Spacing: `gutter 12`, `stack-sm 8`, `stack-md 16`, `stack-lg 24`, `margin-main 16`, `safe-bottom 34`.
- Radius: `button 16`, `card 24`, `sheet 28` (bottom-sheet top), `full 9999`.
- Shadow: `ambient 0 10 30 rgba(0,0,0,.08)`, `lift 0 15 40 rgba(0,0,0,.12)`, `glow 0 0 40 rgba(52,199,89,.4)`. Karta: `0 10 30 rgba(0,0,0,.14)`. ❤️ tugma: `0 10 24 rgba(167,56,51,.3)`.

### 4.4 Asosiy komponentlar (shared/widgets)

Har biri token-asoslangan, Figma komponenti bilan 1:1:
- **DiydorButton** — primary/secondary/ghost; height 56; radius 16; `press` (scale .96 + haptic).
- **DiydorCard** — radius 24, ambient shadow.
- **SegmentedTabs** — pill track (`surface-subtle`), faol pill `surface-warm` + shadow.
- **AppBarBlur** — `bg-surface/70` + backdrop blur (glassmorphism); Flutter'da `BackdropFilter`.
- **InterestChip** — pill, ikonka + matn; karta ustida `white/20` + blur.
- **ShimmerBox** — skeleton (shimmer keyframe → `flutter_animate` shimmer).
- **EmptyState** — doira ikonka + sarlavha + matn.
- **BottomSheet** — radius 28, drag handle, spring slide-up.
- **PrimaryGradientHeader / Paywall sheet / MatchOverlay** — §6.

---

## 5. Backend API kontrakti

Backend O'ZGARMAYDI. Base URL: `https://diydorapp.uz/api`. Auth: `Authorization: Bearer <JWT>`. Xato formati: `{ statusCode, message, code? }` → Flutter `ApiException(status, code)`.

**Asosiy endpointlar (mavjud):**
- Auth: `POST /auth/guest`, `POST /auth/telegram`, `GET /users/me`, `PATCH /users/me`
- Onboarding: `PATCH /users/me` (gender/seekingGender/intent/birthDate/bio/interests), `POST /photos` (base64), `POST /users/me/verify` (selfie → `localhost:8000/api/verify`)
- Discovery: `GET /discovery?limit=&nearby=`, `POST /swipes` ({targetId, action: LIKE|PASS|SUPERLIKE} → `{match, matchId, user}`), `GET /likes-you` (`{locked, count, items}`)
- Matches/Chat: `GET /matches`, `GET /matches/:id/messages`, `POST /matches/:id/messages`, `POST /matches/:id/image`, Socket.IO `user_{id}` room, `new_message` event
- Profil: `GET /users/:id` (public, allowlist serialize)
- Iqtisod: `GET /gifts/catalog`, `POST /gifts/send`, `GET /coins/packages`, `POST /coins/order` (Payme checkout), `GET /wallet`, `POST /wallet/withdraw`
- Obuna: `GET /subscriptions/plans`, `GET /subscriptions/me`, `POST /subscriptions/order`
- Config: `GET /config/public` (@Public — Welcome branding + **motion config**, §7)

**Qo'shilishi kerak (Flutter uchun, §9):**
- `DELETE /users/me` — hisobni o'chirish (do'kon talabi)
- `POST /iap/verify` (Apple/Google receipt validatsiya → coin/obuna kreditlash)
- `/config/public` ga `motion` bloki (§7)

**Paywall kod'lari (React'dan):** `SWIPE_LIMIT`, `SUPERLIKE_LIMIT` → Subscription ekraniga yuboradi. `whoLikedMe.locked` → Gold gate. Ayollar (`gender==='FEMALE'`) uchun limit/lock yo'q.

---

## 6. Animatsiya spetsifikatsiyasi (aniq qiymatlar)

> Bu qiymatlar React `framer-motion` + CSS keyframes'dan **aniq** olindi. Flutter'da ekvivalentlari berilgan. **Hammasi MotionConfig orqali override qilinadi (§7) — bu yerda default'lar.**

### 6.1 Easing / Spring (default presetlar)
- **Asosiy easing** `easeOutExpo` = cubic-bezier(0.16, 1, 0.3, 1) → Flutter `Cubic(0.16, 1.0, 0.3, 1.0)`.
- **Spring-in (overshoot)** = cubic-bezier(0.175, 0.885, 0.32, 1.275) → `Curves.easeOutBack` yoki custom.
- **Karta qaytishi (spring):** stiffness 320, damping 22 → Flutter `SpringDescription(mass:1, stiffness:320, damping:22)` (`SpringSimulation`).
- **Match avatar spring:** stiffness 260, damping 18; ❤️ ikonka: stiffness 300, damping 12.
- **Paywall sheet spring:** stiffness 320, damping 32.

### 6.2 Svayp fizikasi (Discover — asosiy "wow")
- Drag: `dragElastic 0.65`, momentum off, `touch-none`.
- Rotatsiya: x ∈ [-220, 220] → rotate ∈ [-16°, 16°].
- Overlay opacity: LIKE x∈[30,140]→[0,1]; NOPE x∈[-30,-140]→[0,1]; SUPER y∈[-30,-140]→[0,1].
- **Threshold (drag end):** up: `offset.y < -130 && |offset.x| < 110`; right: `offset.x > 120 || velocity.x > 650`; left: `offset.x < -120 || velocity.x < -650`; aks holda spring qaytish.
- **Chiqish animatsiyasi:** right→x:700, left→x:-700, up→y:-900; duration 0.34s, easeOutExpo; 300ms keyin `onExited(action)`.
- Stack: orqa karta scale 0.94, y+12 (statik), oldingisi scale 1.
- Karta kirishi: scale 0.94→1, opacity 0.5→1, 0.3s easeOutExpo.
- Tugmalar: `whileTap scale 0.86` + **haptic light**.

### 6.3 Match overlay
- Fon: primary (`#A73833`) to'liq ekran, fade-in 0.25s.
- 2 avatar: spring kirish (chap delay 0.1, o'ng delay 0.35), bir-biriga -16px overlap.
- ❤️ ikonka: heartbeat (scale 1→1.15→1→1.1, 1.4s infinite).
- Sarlavha "Bu birgalikda!" y:20→0, delay 0.25; matn delay 0.32; tugmalar delay 0.4.
- **ConfettiBurst:** 24 bo'lak, ranglar `#fff #ffd9d6 #ffb3ad #ffe08a`, y:-40→110vh, rotate 360, dur 1.4–2.6s random, easeIn. Flutter'da `confetti` paketi yoki custom.
- **Haptic:** match'da `HapticFeedback.heavyImpact()`.

### 6.4 Boshqa
- **Splash heartbeat** logo (1.4s infinite).
- **fadeInUp** 0.8s easeOutExpo, delay 0/0.1/0.2 (onboarding sarlavhalar).
- **springIn** 0.5s (scale 0.95→1.02→1).
- **shimmer** 1.4s (skeleton).
- **kenBurns** 12s scale 1→1.08 (hero rasm — premium hissi).
- **Paywall:** fon black/50 + backdrop blur, sheet `y:100%→0` spring.
- **prefers-reduced-motion** → barcha animatsiya ~0ms. Flutter: `MediaQuery.disableAnimations` ni hurmat qilish + MotionConfig `reducedMotion` toggle.

---

## 7. 🎛 MOTION ENGINE — admin paneldan boshqariladigan animatsiyalar

Bu ilovaning eng o'ziga xos qismi. **Maqsad:** kodda hech qanday "qotirilgan" animatsiya qiymati bo'lmasin; admin panel orqali jonli sozlansin (A/B test, brending, bayram temalari).

### 7.1 Tamoyil
1. Backend `AppConfig` (singleton) ga `motion` JSON bloki qo'shiladi (admin tahrirlaydi).
2. `GET /config/public` ichida `motion` qaytadi (allaqachon Welcome branding qaytaradi — kengaytiriladi).
3. Flutter boot'da `MotionConfigProvider` uni oladi, Hive/prefs'ga **keshlaydi** (offline/birinchi-freym uchun **default'lar**).
4. Har bir animatsiya widget qiymatni `MotionConfig`dan oladi: `motion.cardSwipe.exitDurationMs`, `motion.match.confettiCount`, `motion.global.reducedMotion`, va h.k.
5. Admin panelda "Animatsiya" ekrani — slider/toggle/Lottie-URL maydonlari → `PUT /admin/config` → cache invalidate → keyingi boot'da (yoki live refresh'da) qo'llanadi.

### 7.2 MotionConfig sxemasi (default qiymatlar bilan)

```jsonc
{
  "version": 3,
  "global": {
    "enabled": true,
    "reducedMotion": false,         // majburiy o'chirish (a11y/past qurilma)
    "speedMultiplier": 1.0,         // hamma duration'ga ko'paytiriladi (0.5=tez, 1.5=sekin)
    "hapticsEnabled": true
  },
  "easing": {                       // nomli egri chiziqlar (cubic-bezier)
    "standard": [0.16, 1, 0.3, 1],
    "overshoot": [0.175, 0.885, 0.32, 1.275]
  },
  "cardSwipe": {
    "rotateMaxDeg": 16,
    "exitDurationMs": 340,
    "exitDistanceX": 700,
    "exitDistanceUp": 900,
    "thresholdX": 120,
    "thresholdVelocity": 650,
    "thresholdUp": 130,
    "spring": { "stiffness": 320, "damping": 22 },
    "stackScale": 0.94, "stackOffsetY": 12,
    "enterDurationMs": 300
  },
  "buttons": { "tapScale": 0.86, "pressScale": 0.96, "pressDurationMs": 200 },
  "match": {
    "overlayFadeMs": 250,
    "avatarSpring": { "stiffness": 260, "damping": 18 },
    "heartSpring": { "stiffness": 300, "damping": 12 },
    "heartbeat": true,
    "confettiCount": 24,
    "confettiColors": ["#FFFFFF", "#FFD9D6", "#FFB3AD", "#FFE08A"],
    "lottieUrl": null               // null bo'lsa konfetti; URL bo'lsa Lottie o'ynaydi
  },
  "splash": { "heartbeat": true, "heartbeatPeriodMs": 1400, "minDurationMs": 800 },
  "transitions": {                  // go_router sahifa o'tishlari
    "pageType": "sharedAxis",       // sharedAxis | fade | cupertino | slide
    "durationMs": 300
  },
  "skeleton": { "shimmerMs": 1400 },
  "heroImage": { "kenBurns": true, "kenBurnsDurationMs": 12000, "scaleTo": 1.08 },
  "gifts": {                        // sovg'a animatsiyalari (chatda)
    "lottieByGiftId": { "rose": "https://.../rose.json", "teddy": "https://.../teddy.json" },
    "fallbackEmoji": true
  }
}
```

### 7.3 Flutter implementatsiyasi (qisqacha)
- `MotionConfig` — `freezed` + `json_serializable` model; `MotionConfig.defaults()` factory (yuqoridagi qiymatlar — ilova offlinе'da ham ishlasin).
- `motionConfigProvider` (Riverpod `AsyncNotifier`): boot'da kesh'dan o'qiydi → fonda `/config/public` dan yangilaydi.
- Helper extension'lar: `context.motion`, `Duration get cardExit => ...` va `Curve` builderlari (cubic-bezier listdan `Cubic`).
- `speedMultiplier` va `reducedMotion` global — har bir Duration'ga qo'llaniladi (`reducedMotion` → 1ms).
- **Muhim:** widget'lar MotionConfig'ni `watch` qiladi → admin o'zgartirsa hot-refresh (foreground'ga qaytganda `/config/public` qayta o'qiladi).

### 7.4 Admin panel (mavjud `apps/admin`) — yangi "Animatsiya" ekrani
React admin'ga `Motion.tsx` qo'shiladi: yuqoridagi maydonlar uchun slider/switch/color/URL; `PUT /admin/config` (motion bloki). Bu mavjud admin steki (React+Vite+Tailwind, `diydor_admin_token`) ichida — Flutter EMAS.

---

## 8. Do'kon-mosligi va xavfsizlik (App Store + Google Play)

### 8.1 ⛔ Eng katta nuqta: raqamli tovar = IAP
- **Apple Guideline 3.1.1 / Google Play To'lov siyosati:** ilova ichida ishlatiladigan **raqamli tovar/xizmat** (tanga, obuna, virtual sovg'a) **majburiy** Apple IAP / Google Play Billing orqali sotilishi kerak. Payme/Click bilan sotsangiz — rad/ban.
- **Yechim:**
  - Mobil (iOS+Android): tanga paketlari va obunalar = `in_app_purchase` plagini (StoreKit 2 + Play Billing). Backend `POST /iap/verify` bilan receipt'ni tekshirib coin/obuna kreditlaydi.
  - **Jismoniy** tovar/xizmat (haqiqiy gul yetkazib berish, partner orqali) = IAP'dan **ozod** → Payme qolishi mumkin.
  - Web (PWA/`diydorapp.uz`) = Payme qoladi (web IAP talab qilmaydi).
- **Narx:** IAP ~30% (yoki kichik biznes 15%) komissiya — moliyaviy modelni qayta hisoblang.
- **Withdraw (pul yechish):** bu user-to-user "real pul" — IAP EMAS; lekin Apple "tips/peer payments" qoidalari va MB litsenziyasiga ehtiyot bo'ling. Hozircha qo'lda/karta (admin tasdiqlaydi) — saqlanadi.

### 8.2 UGC (Apple 1.2) — tanishuv ilovalari uchun majburiy
- Kontent filtri (NSFW rasm — backend `AI_Mod`/NudeNet rejasi).
- Foydalanuvchi **report** + **block** mexanizmi (bor) — ekranda ko'rinadigan qilinsin.
- Tahqirli kontentni 24 soatda olib tashlash + foydalanuvchini bloklash siyosati (EULA'da).
- **EULA (zero-tolerance) tasdiqlash** — onboarding'da yoki birinchi chatdan oldin "tahqirli xatti-harakat taqiqlanadi" roziligi (Apple buni aniq talab qiladi).

### 8.3 Hisobni o'chirish (account deletion) — MAJBURIY
- Settings → "Hisobni o'chirish" → tasdiq → `DELETE /users/me` (ma'lumotlarni o'chirish/anonimlashtirish). Ikkala do'kon talabi.

### 8.4 Yosh, maxfiylik, ruxsatlar
- Yosh reytingi: **17+** (App Store), Google'da "Dating" kategoriyasi + 18+.
- 18+ majburiy gate (bor — birthDate).
- Privacy nutrition label / Data safety form: yig'iladigan ma'lumotlar (rasm, joylashuv, telefon) e'lon qilinadi.
- **App Tracking Transparency (iOS)** — agar reklama/tracking bo'lsa, ATT so'rovi.
- Ruxsatlar runtime'da, kontekst bilan so'raladi (kamera = selfie'da, joylashuv = "Yaqin atrofda" da, bildirishnoma = match'dan keyin).
- Joylashuv: faqat zarur aniqlik (shahar darajasi — backend `nearby` city filtri), background location YO'Q.

### 8.5 Texnik xavfsizlik (backend bor, klient tomoni)
- JWT secure storage (Keychain/Keystore), HTTPS pinning (ixtiyoriy `dio` + `http_certificate_pinning`).
- Maxfiylik teshigi tuzatilgan (public profil allowlist) — Flutter model ham faqat shu maydonlarni kutadi.
- Rate-limit/Helmet/CORS backend'da bor.
- Deep-link / Universal Links (parol tiklash, match push → chat) xavfsiz handle qilinadi.

---

## 9. Bosqichlar (yo'l xaritasi) va promtlar bilan bog'lanish

| Bosqich | Promt | Natija |
|---------|-------|--------|
| 0 | `P00_bootstrap` | Flutter loyiha, papka tuzilishi, paketlar, env, CI skeleti |
| 1 | `P01_design_system` | Theme, ranglar, tipografika, shared widgetlar, dark mode |
| 2 | `P02_motion_engine` | MotionConfig model+provider+helper, admin "Animatsiya" ekrani (React) |
| 3 | `P03_core_network_auth` | dio/retrofit, secure store, ApiException, auth+redirect guard, go_router |
| 4 | `P04_onboarding` | Welcome→…→Verified (kamera, fadeInUp, validatsiya) |
| 5 | `P05_discover_swipe` | Svayp kartalar (custom, §6 fizika), MatchOverlay, Paywall, haptics |
| 6 | `P06_match_chat` | Messages, Chat (socket.io, rasm, sovg'a Lottie) |
| 7 | `P07_profile` | MyProfile, EditProfile, ProfileDetail, Likes (Gold gate) |
| 8 | `P08_monetization_iap` | Subscription, CoinStore, Wallet, Withdraw, GiftStore + **IAP** |
| 9 | `P09_store_compliance` | Account deletion, EULA, report/block UI, permissions, privacy, push |
| 10 | `P10_polish_qa` | Lottie/glassmorphism/haptics sayqal, a11y, test, store assets |

Har bir promt: kontekst (shu MASTER'ga ishora) + aniq vazifa + acceptance kriteriya + tegishli backend endpointlar + token/motion qiymatlar.

---

## 10. "Wow" darajaga ko'tarish (premiumlashtirish ro'yxati)

Joriy dizaynni saqlab, quyidagilar qo'shiladi (P10 + tegishli promtlarda):
- **Dark mode** birinchi-darajali, AMOLED-do'st (`platinum-dark`), gradient urg'ular.
- **Glassmorphism**: AppBar, paywall, chip'lar — `BackdropFilter` blur + yarim shaffof.
- **Haptics** har joyda: svayp boshlanishi (selection), match (heavy), tugma (light), like (medium).
- **Lottie**: match konfetti o'rniga ixtiyoriy Lottie, sovg'a animatsiyalari (chatda gul ochilishi), bo'sh holatlar.
- **Mikro-animatsiya** (`flutter_animate`): ro'yxat elementlari stagger fadeInUp, tugma shimmer, badge pulse.
- **Ken Burns** profil hero rasmiga; foto karusel parallax.
- **Skeleton shimmer** hamma yuklanishda (karta, inbox, profil).
- **Spring** o'tishlar (sahifa, bottom-sheet, modal) — MotionConfig `transitions`.
- **Gradient mesh / nur** fon Welcome va Match'da (premium hissi).
- **Tactile svayp**: overlay badge ("YOQDI/KEYINGI/SUPER") + rang nuri + haptic intensivligi drag masofasiga bog'liq.

Hammasi MotionConfig orqali yoqib/o'chiriladi → admin "bayram temasi" yoki "tinch rejim" yoqishi mumkin.
