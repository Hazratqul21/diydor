# P08 — Monetizatsiya + IAP (do'kon-mos to'lov)

> ⚠️ Kontekst: `01_MASTER.md` §8.1 (raqamli tovar = majburiy IAP). Bu eng nozik do'kon-moslik nuqtasi. Manba React: `Subscription.tsx`, `CoinStore.tsx`, `Wallet.tsx`, `Withdraw.tsx`, `GiftStore.tsx`.

## Promt

```
Diydor monetizatsiya ekranlarini do'kon-qonunlariga MOS qurib chiq. Manba: docs/flutter/01_MASTER.md §8.1, §5. KRITIK: mobil ilovada raqamli tovar (tanga, obuna, virtual sovg'a) Payme orqali SOTILMAYDI — Apple IAP / Google Play Billing (in_app_purchase) majburiy.

Vazifa:
1. To'lov strategiyasi qatlami (lib/features/billing):
   - Platforma aniqlash: iOS/Android → in_app_purchase; Web → Payme.
   - Mahsulot turlari: COINS (consumable), SUBSCRIPTION (auto-renewable), VIRTUAL_GIFT (consumable) → IAP. PHYSICAL_GIFT (haqiqiy gul) va WITHDRAW → IAP EMAS.
   - in_app_purchase: mahsulot ID'lari (App Store Connect / Play Console'da yaratiladi) ⇄ backend paket ID'lari mapping. Sotib olish → receipt → POST /iap/verify {platform, productId, purchaseToken/receipt} → backend tasdiqlab coin/obuna kreditlaydi → restorePurchases.
2. SubscriptionPage (/subscription) — Plus/Gold/Platinum, davr toggle (Hafta/Oy/Yil, -% chegirma) GET /subscriptions/plans. Sotib olish: mobil→IAP subscription; ayolga "bepul premium" ekran (sotib olish yashirin, MASTER jins-to'lov). from=swipe konteksti. Apple talab: narx, davr, auto-renew sharti, Terms/Privacy linklari ko'rinsin.
3. CoinStorePage (/coins) — GET /coins/packages; mobil→IAP consumable; web→Payme checkout (webview_flutter yoki tashqi brauzer). Restore tugmasi.
4. WalletPage (/wallet) — GET /wallet (coinBalance, walletBalance). Tarix.
5. WithdrawPage (/wallet/withdraw) — karta raqami + summa (min cfg.minWithdrawSom), POST /wallet/withdraw → PENDING WithdrawalRequest (admin qo'lda tasdiqlaydi). Bu IAP EMAS (real pul yechish).
6. GiftStore (/gifts/:matchId, bottom-sheet) — GET /gifts/catalog; virtual sovg'a→IAP/coin balans; "real gul" (jismoniy, partner) → Payme/alohida oqim (IAP'dan ozod). POST /gifts/send → chatda GIFT xabar.
7. Backend qo'shimcha (apps/api): POST /iap/verify — Apple App Store Server API / Google Play Developer API bilan receipt tekshirish (server-side), idempotent kreditlash, webhook (renewal/refund). Mavjud Payme oqimi web uchun saqlanadi.

Acceptance:
- iOS/Android'da tanga/obuna FAQAT IAP orqali (Payme tugmasi ko'rinmaydi) — App Store/Play rad etmasligi uchun.
- Web'da Payme ishlaydi.
- Restore purchases ishlaydi; receipt backend'da tasdiqlanadi (klient-ishonchsiz emas).
- Ayollar obuna/tanga sotib ololmaydi (bepul) — UI yashiradi, backend 400.
- Withdraw PENDING so'rov yaratadi.
```
