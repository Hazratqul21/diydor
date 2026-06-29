# P05 — Discover (svayp kartalar + Match + Paywall) — ASOSIY "WOW"

> Kontekst: `01_MASTER.md` §6.2/§6.3 (aniq svayp fizikasi va match), §5 (discovery/swipes/paywall kodlari). Manba React: `apps/mobile/src/screens/Discover.tsx`.

## Promt

```
Diydor'ning asosiy ekrani — Discover svayp tizimini qur. Bu eng muhim "wow" qismi. Manba: docs/flutter/01_MASTER.md §6.2 va §6.3 (ANIQ qiymatlar). Barcha animatsiya parametrlari MotionConfig.cardSwipe/match dan (context.motion).

Vazifa:
1. DiscoverPage — SegmentedTabs (Siz uchun / Yaqin atrofda) glassmorphism AppBarBlur header. GET /discovery?limit=20&nearby=. Loading=ShimmerBox karta. Bo'sh=EmptyState (nearby uchun boshqa matn).
2. SwipeCard (custom, package EMAS — to'liq nazorat uchun):
   - GestureDetector + AnimationController; karta Transform (translate x/y + rotate).
   - rotate: x ∈ [-rotateRange, +rotateRange] → [-rotateMaxDeg, +rotateMaxDeg] (motion).
   - Overlay badge'lar: "YOQDI"(success, chap, -16°), "KEYINGI"(error, o'ng, +16°), "SUPER"(tertiary, yuqori) — opacity drag masofasiga bog'liq (MASTER §6.2 oraliqlari).
   - Drag end threshold (motion.cardSwipe): up (offset.y < -thresholdUp && |dx|<110), right (dx>thresholdX || vx>thresholdVelocity), left (aksincha) — aks holda spring qaytish (SpringSimulation stiffness/damping motion dan).
   - Chiqish: right→x:exitDistanceX, left→-exitDistanceX, up→y:-exitDistanceUp; exitDurationMs, easing standard; tugagach onExited(action).
   - Drag boshlanishi → HapticFeedback.selectionClick (intensivlik masofaga qarab — light→medium).
   - Karta tap (drag emas) → ProfileDetail (/u/:id).
   - Karta foni: rasm (cached_network_image) + pastdan gradient (black 90→0); pastda ism, yosh, verified badge, shahar, qiziqish chiplari (InterestChip onGlass).
   - Stack: orqada CardStatic (scale=stackScale, y+stackOffsetY); oldingisi enter anim (scale enterDuration).
3. ActionButtons — ✕(PASS, secondary, 56), ★(SUPERLIKE, tertiary, 48), ❤️(LIKE, primary, 64, primaryCta shadow). whileTap scale=buttons.tapScale + haptic. Imperativ: tugma SwipeCard.swipe(dir) ni chaqiradi (GlobalKey/controller).
4. Swipe oqimi: optimistik idx++ → POST /swipes {targetId, action}. Javob match=true → MatchOverlay. ApiException code SWIPE_LIMIT/SUPERLIKE_LIMIT → idx-- (kartani qaytar) + Paywall ko'rsat.
5. MatchOverlay (MASTER §6.3): primary fon to'liq ekran, 2 avatar spring (delay 0.1/0.35, overlap), ❤️ heartbeat, sarlavha "Bu birgalikda!", "Siz va X bir-biringizga yoqdingiz", tugmalar "Xabar yozish"(→/chat/:matchId) / "Davom etish". ConfettiBurst (confetti paketi yoki custom: confettiCount, confettiColors) YOKI motion.match.lottieUrl bo'lsa Lottie. HapticFeedback.heavyImpact match'da.
6. Paywall (MASTER §6: bottom-sheet, black/50+blur fon, spring slide-up): sarlavha+matn (limit turi), "Obuna olish"(→/subscription?from=swipe), "Keyinroq". useScrollLock ekvivalenti (fon scroll bloklash).
7. Ayollar (gender FEMALE) hech qachon paywall ko'rmaydi (backend limit qaytarmaydi — klient ham ehtiyot tariqasida tekshiradi).

Acceptance:
- Svayp his-tuyg'usi React versiyasiga teng yoki undan yaxshi (60fps, threshold/spring aynan §6.2).
- Match overlay to'liq animatsion + konfetti/Lottie + haptic.
- Limit → Paywall → Subscription oqimi ishlaydi; ayollarga limit yo'q.
- Barcha qiymat motion.* dan; reducedMotion'da svayp baribir ishlaydi (faqat oraliq animatsiyalar qisqaradi).
```
