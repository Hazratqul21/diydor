# P09 — Do'kon-moslik (account deletion, EULA, moderatsiya, push, ruxsatlar)

> ⚠️ Kontekst: `01_MASTER.md` §8. Bularsiz ilova App Store / Google Play'da RAD etiladi.

## Promt

```
Diydor'ni App Store + Google Play talablariga to'liq moslab chiq. Manba: docs/flutter/01_MASTER.md §8.

Vazifa:
1. Hisobni o'chirish (MAJBURIY) — SettingsPage'da "Hisobni o'chirish": tasdiq dialog → DELETE /users/me (backend: ma'lumotni o'chirish/anonimlashtirish, foto/match/xabar). Logout + '/'.
2. EULA / zero-tolerance (Apple 1.2 UGC) — onboarding'da yoki birinchi chatdan oldin: "Tahqirli kontent va xatti-harakat taqiqlanadi; buzganlar bloklanadi" roziligi (checkbox + tasdiq). Legal sahifalarga link.
3. Report/Block UI to'liq — ProfileDetail va Chat'da: "Shikoyat qilish" (sabab tanlash → backend report), "Bloklash" (→ darhol yashirish). Bloklangan userlar discovery/chat'dan chiqadi. Admin 24 soatda ko'rib chiqadi (mavjud admin Reports).
4. Ruxsatlar (permission_handler) — kontekstli, oldindan-tushuntirish (pre-permission dialog): kamera (selfie/chat rasm), bildirishnoma (match/xabar), joylashuv (faqat "Yaqin atrofda" — shahar darajasi, background YO'Q). Rad etilsa — funksiya yumshoq o'chadi + Settings'ga yo'naltirish.
5. Push (firebase_messaging + flutter_local_notifications) — FCM token → backend (POST /users/me/push-token, qo'shiladi). Match/yangi xabar push → tegishli ekranga deep-link. iOS APNs sozlamasi. Foreground/background/terminated holatlar.
6. Privacy/Data safety — README'da yig'iladigan ma'lumotlar ro'yxati (App Store nutrition label + Play Data safety form uchun): rasm, joylashuv(shahar), telefon(ixtiyoriy), foydalanish. ATT (agar tracking bo'lsa) — hozir tracking yo'q deb belgilan.
7. Yosh reytingi: iOS 17+, Play "Dating" 18+. Info.plist/AndroidManifest tegishli usage description matnlari (o'zbekcha): NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSLocationWhenInUseUsageDescription, NSUserTrackingUsageDescription(agar kerak).

Acceptance:
- Settings'da ishlaydigan "Hisobni o'chirish" (DELETE /users/me).
- EULA roziligisiz chat/UGC bo'lmaydi.
- Report+Block ishlaydi, bloklangan user ko'rinmaydi.
- Ruxsatlar kontekstli; rad etishda ilova qulamaydi.
- Push deep-link match/chat'ga olib boradi.
- Info.plist/Manifest usage description'lar to'liq (o'zbekcha).
```
