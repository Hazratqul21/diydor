# P06 — Messages + Chat (real-time, rasm, sovg'a)

> Kontekst: `01_MASTER.md` §5 (matches/messages/socket), §6 (Lottie sovg'a). Manba React: `Messages.tsx`, `Chat.tsx`.

## Promt

```
Diydor chat tizimini qur. Manba: docs/flutter/01_MASTER.md §5, §6.

Vazifa:
1. lib/core/socket/socket_service.dart — socket_io_client, JWT auth (handshake), user_{id} room, `new_message` event → stream. Connect/disconnect lifecycle (faqat foreground). Reconnect.
2. MessagesPage (/messages) — GET /matches inbox: avatar, ism, oxirgi xabar preview (IMAGE→"📷 Rasm", GIFT→"🎁 Sovg'a"), vaqt, unread badge. Bo'sh holat. Stagger fadeInUp ro'yxat. Pull-to-refresh.
3. ChatPage (/chat/:id) — GET /matches/:id/messages; bubble sent/received (senderId=joriy user); socket'dan real-time qo'shilish; vaqt belgisi (lib/utils/time). Yuborish: POST /matches/:id/messages. Optimistik UI.
   - Rasm: image_picker → compress → base64 → POST /matches/:id/image; IMAGE bubble (cached_network_image, tap→full screen).
   - Sovg'a: gift tugma → GiftStore (/gifts/:matchId) bottom-sheet; GIFT xabar render — motion.gifts.lottieByGiftId[id] bo'lsa Lottie o'ynaydi (bir marta), aks holda emoji (🌹). Lottie fallbackEmoji.
   - Icebreaker: bo'sh chatda taklif matnlari.
   - "yozmoqda..." / online — agar backend Redis presence bersa (hozir bo'lmasa, joy qoldir).
4. Report/Block kirish nuqtasi: chat AppBar overflow menu → "Shikoyat" / "Bloklash" (§ store compliance P09 ga ulanadi).

Acceptance:
- Real-time: 2 qurilma orasida xabar darhol ko'rinadi (socket).
- Rasm yuborish + ko'rsatish; sovg'a Lottie/emoji bilan render.
- Inbox preview to'g'ri (rasm/sovg'a/matn); unread.
- Report/Block menyu bor.
```
