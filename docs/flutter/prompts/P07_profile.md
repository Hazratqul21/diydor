# P07 — Profil ekranlari + Likes (Gold gate)

> Kontekst: `01_MASTER.md` §5 (users/:id allowlist, likes-you), §8 (maxfiylik). Manba React: `MyProfile.tsx`, `EditProfile.tsx`, `ProfileDetail.tsx`, `Likes.tsx`.

## Promt

```
Diydor profil ekranlarini qur. Manba: docs/flutter/01_MASTER.md.

Vazifa:
1. MyProfilePage (/profile) — o'z profili: hero rasm (ken-burns), ism/yosh, bio, qiziqishlar. Tanga chip (→/wallet). Premium banner (obunasiz erkak→/subscription; ayol→"Premium faol" badge, sotib olish yashirin). "Profilni tahrirlash"(→/profile/edit), Sozlamalar(→/settings). Bo'sh holatlar ("Bio qo'shing").
2. EditProfilePage (/profile/edit) — bio (textarea), shahar (dropdown — nearby uchun kerak), qiziqishlar (toggle chiplar). PATCH /users/me. Rasm boshqaruvi (qo'shish/o'chirish/tartib) → /photos.
3. ProfileDetailPage (/u/:userId) — GET /users/:id (public allowlist: id,firstName,gender,seekingGender,intent,bio,interests,age,city,isVerified,photos,prompts — FAQAT shular; model ortiqcha maydon kutmaydi). Foto karusel (parallax/page indicator), to'liq ma'lumot. Pastda action: ✕/★/❤️ (Discover bilan bir xil swipe natijasi → match bo'lsa overlay). Report/Block menu.
4. LikesPage (/likes) — GET /likes-you → {locked, count, items}. Obunasiz erkak: blur grid + paywall ("X kishi sizni yoqtirdi", "Gold oling"→/subscription). Gold+ yoki ayol: ochiq grid (tap→ProfileDetail). Bo'sh holat.

Acceptance:
- Public profilda faqat allowlist maydonlar (maxfiylik teshigi yo'q).
- Likes Gold gate: obunasiz erkak blur; Gold/ayol ochiq.
- EditProfile shahar saqlanadi (nearby ishlashi uchun).
- Foto karusel silliq (parallax/indicator).
```
