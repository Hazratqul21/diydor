# P02 — Motion Engine (admin paneldan boshqariladigan animatsiyalar)

> Kontekst: `01_MASTER.md` §6 (aniq qiymatlar) va §7 (motion engine sxemasi). Bu ilovaning o'ziga xos qismi.

## Promt (Flutter qismi)

```
Diydor "Motion Engine" ni qur — barcha animatsiya parametrlari MotionConfig'dan keladi, kodda sehrli raqam bo'lmaydi, admin paneldan jonli sozlanadi. Manba: docs/flutter/01_MASTER.md §6 va §7.

Vazifa:
1. lib/core/motion/motion_config.dart — freezed + json_serializable model, MASTER §7.2 sxemasi bo'yicha: global(enabled, reducedMotion, speedMultiplier, hapticsEnabled), easing(standard, overshoot — List<double>), cardSwipe(rotateMaxDeg, exitDurationMs, exitDistanceX/Up, thresholdX/Velocity/Up, spring{stiffness,damping}, stackScale, stackOffsetY, enterDurationMs), buttons, match(overlayFadeMs, avatarSpring, heartSpring, heartbeat, confettiCount, confettiColors, lottieUrl), splash, transitions(pageType, durationMs), skeleton, heroImage, gifts. `MotionConfig.defaults()` factory — MASTER §6 dagi ANIQ default qiymatlar bilan (offline'da ishlash uchun).
2. lib/core/motion/motion_provider.dart — Riverpod AsyncNotifier `motionConfigProvider`: boot'da Hive/shared_preferences kesh'dan o'qiydi (yo'q bo'lsa defaults), keyin fonda GET /config/public dan `motion` blokini olib yangilaydi + keshlaydi. App foreground'ga qaytganda qayta o'qish (AppLifecycleListener).
3. lib/core/motion/motion.dart — helperlar:
   - `Curve curveFromCubic(List<double>)` → Cubic.
   - `Duration scaled(int ms)` → global.speedMultiplier qo'llaydi; reducedMotion yoki MediaQuery.disableAnimations bo'lsa 1ms qaytaradi.
   - `SpringDescription springFrom(MotionSpring)`.
   - `extension MotionX on BuildContext { MotionConfig get motion; }` (ref orqali).
   - `maybeHaptic(HapticType)` — global.hapticsEnabled tekshiradi.
4. lib/core/motion/page_transitions.dart — go_router uchun CustomTransitionPage builder: motion.transitions.pageType (sharedAxis/fade/cupertino/slide) + scaled duration.
5. Test: motion_config_test.dart — defaults parse, JSON round-trip, speedMultiplier & reducedMotion mantiqi.

Acceptance:
- /config/public javobida 'motion' bo'lmasa ham app defaults bilan ishlaydi (offline-first).
- speedMultiplier=0.5 → barcha duration yarmiga; reducedMotion=true → ~0.
- Hech bir feature widget animatsiyada raw Duration/Curve yozmaydi — hammasi context.motion orqali.
```

## Promt (Admin panel — React, mavjud apps/admin)

```
Mavjud React admin paneliga (apps/admin, diydor_admin_token) "Animatsiya" ekranini qo'sh. Backend AppConfig ga `motion` JSON bloki qo'shiladi (Prisma Json maydon), GET /config/public va GET /admin/config da qaytadi, PUT /admin/config bilan saqlanadi.

Vazifa:
1. Backend (apps/api): AppConfig.motion (Json, default = MASTER §7.2 sxemasi). public-config controller'ga `motion` qo'sh. admin updateConfig motion ni qabul qiladi + settings cache invalidate.
2. Admin UI: src/screens/Motion.tsx — MASTER §7.2 maydonlari uchun slider (duration/stiffness/damping/multiplier), switch (enabled/reducedMotion/haptics/heartbeat), color picker (confettiColors), URL input (lottieUrl/gifts). "Saqlash" → PUT /admin/config. "Default'ga qaytarish" tugmasi.
3. Sidebar/route'ga "Animatsiya" qo'sh.

Acceptance:
- Admin slider o'zgartirib saqlasa → /config/public da yangi qiymat → Flutter keyingi foreground'da qo'llaydi.
- Noto'g'ri qiymatlar validatsiya qilinadi (min/max).
```
