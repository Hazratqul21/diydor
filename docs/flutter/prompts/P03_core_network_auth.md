# P03 — Network, Auth, Routing (redirect guard)

> Kontekst: `01_MASTER.md` §3.3 (redirect guard) va §5 (API kontrakti).

## Promt

```
Diydor uchun network qatlami, autentifikatsiya va go_router'ni qur. Manba: docs/flutter/01_MASTER.md §3.3, §5.

Vazifa:
1. lib/core/error/api_exception.dart — ApiException{int status, String? code, String message}. React ApiError bilan bir xil (code: SWIPE_LIMIT/SUPERLIKE_LIMIT va h.k.).
2. lib/core/storage/secure_store.dart — flutter_secure_storage: token saqlash/o'qish/o'chirish (kalit 'diydor_token').
3. lib/core/network/dio_client.dart — dio + interceptor: baseUrl=env API_BASE_URL; Authorization Bearer; xato → ApiException (backend {statusCode,message,code} ni map qiladi); log (debug). 401 → token tozalash + /'ga signal.
4. lib/core/network/api_service.dart — retrofit interfeysi MASTER §5 endpointlari uchun: auth (guest/telegram), users (me get/patch, public :id, verify, delete), photos, discovery, swipes, likes-you, matches+messages+image, gifts, coins/order, wallet/withdraw, subscriptions, config/public. DTO/model'lar shared/models da (freezed): User, Profile, Photo, Match, Message, Gift, CoinPackage, Plan, MySubscription, WhoLikedMe, SwipeResult, AppPublicConfig.
5. lib/features/auth: authProvider (Notifier) — bootstrap(): token bor? getMe : null. ensureGuestSession() (FAQAT Boshlash'da). loginWithTelegram(initData). logout(). deleteAccount().
6. lib/app/router.dart — go_router, MASTER §2 route jadvali. `redirect`:
   - boot davom etayotgan bo'lsa splash.
   - token yo'q & protected route → '/'.
   - token bor: getMe.onboardingStep → STEP_ROUTE (GENDER_AGE→/onboarding/gender, INTENT→intent, PHOTOS→photos, VERIFY→verify, PROMPTS|PERMISSIONS|DONE→/discover). Onboarding tugagan user '/' yoki '/onboarding/*' ga kirsa → /discover.
   - token yaroqsiz → tozalash → '/'.
   - Sahifa o'tishlari P02 page_transitions (motion.transitions).
7. ShellRoute + BottomNav (Discover/Likes/Messages/Profile) asosiy ekranlar uchun.

Acceptance:
- Token yo'q → '/' (Welcome). "Boshlash" → guest yaratiladi → onboarding step bo'yicha to'g'ri ekran.
- Onboarding tugagan user qayta onboarding'ga TUSHMAYDI (React bug'i takrorlanmaydi).
- 401 → avtomatik logout → '/'.
- ApiException.code paywall mantig'ida ishlatishga tayyor.
```
