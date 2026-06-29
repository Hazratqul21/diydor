# P00 — Loyiha bootstrap (Flutter skeleti)

> Buni Claude Code'ga bering. Avval `01_MASTER.md` ni kontekstga qo'shing (yoki shu papkani oching).

## Promt

```
Sen Diydor tanishuv ilovasini Flutter'da noldan quryapsan. To'liq spetsifikatsiya `docs/flutter/01_MASTER.md` da — uni o'qib chiq. Bu birinchi bosqich: faqat loyiha skeleti.

Vazifa:
1. Flutter loyihasi yarat: org `uz.diydor`, name `diydor`, Material 3, null-safety, Flutter 3.x / Dart 3. Platformalar: ios, android (web ixtiyoriy).
2. MASTER §3.2 dagi feature-first papka tuzilishini yarat (app/, core/, features/, shared/). Bo'sh placeholder fayllar + barrel export'lar.
3. pubspec.yaml ga MASTER §3.1 paketlarini qo'sh: flutter_riverpod, riverpod_annotation, riverpod_generator(dev), go_router, dio, retrofit, json_serializable(dev), build_runner(dev), freezed+freezed_annotation, flutter_secure_storage, shared_preferences, socket_io_client, cached_network_image, flutter_image_compress, flutter_animate, lottie, confetti, camera, in_app_purchase, webview_flutter, firebase_core, firebase_messaging, flutter_local_notifications, permission_handler, google_fonts (Manrope), intl, flutter_localizations(sdk).
4. Env: --dart-define orqali API_BASE_URL (default https://diydorapp.uz/api), SENTRY_DSN(bo'sh). lib/core/env.dart da o'qi.
5. main.dart: ProviderScope, MaterialApp.router placeholder, bo'sh theme. App ishga tushsin (bo'sh ekran "Diydor").
6. Analiz: analysis_options.yaml (flutter_lints + strict), .gitignore, README (qisqacha run yo'riqnoma).
7. Lokalizatsiya skeleti: l10n.yaml + lib/l10n/app_uz.arb (template), MaterialApp locale 'uz'.

Acceptance:
- `flutter pub get` va `flutter analyze` xatosiz.
- `flutter run` bo'sh "Diydor" ekranini ko'rsatadi.
- build_runner ishlaydi (hozircha generatsiya yo'q bo'lsa ham config tayyor).
Hardcode qiymat ishlatma — keyingi bosqichlarda token/motion keladi. Hech narsani ortiqcha qurma (faqat skelet).
```
