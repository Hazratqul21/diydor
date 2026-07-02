import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { UserActionsSheet } from '@/components/UserActionsSheet';
import { MessageActionsSheet } from '@/components/MessageActionsSheet';
import { AudioRecorder, AudioWaveform } from '@/components/AudioRecorder';

// ── Xabar bubble kirish animatsiyasi ────────────────────────
const bubbleIn = (mine: boolean) => ({
  initial: { opacity: 0, y: 10, x: mine ? 14 : -14, scale: 0.96 },
  animate: { opacity: 1, y: 0, x: 0, scale: 1 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 26 },
});

import { getUserId } from '@/lib/api';
import {
  getMessages,
  sendMessage,
  sendChatImage,
  updateMessage,
  deleteMessage,
  getGiftCatalog,
  photoUrl,
  type Message,
  type Profile,
  type GiftItem,
} from '@/lib/data';
import { getSocket, emitTyping, emitMessageRead, emitLikeMessage } from '@/lib/socket';
import { clockTime } from '@/lib/time';

// ── Icebreakers ─────────────────────────────────────────────
const ICEBREAKERS = [
  'Salom! Qalaysiz? 👋',
  'Qaysi joylarga borishni yoqtirasiz?',
  'Bugun kayfiyat qanday?',
];

// ── Xabar yuborish holati turlari ───────────────────────────
type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

// ── Kengaytirilgan xabar turi (optimistic UI uchun) ────────
interface ExtendedMessage extends Message {
  /** Optimistic UI: vaqtinchalik ID */
  tempId?: string;
  /** Xabar holati: yuborilmoqda / yuborildi / yetkazildi / o'qildi / xatolik */
  status?: MessageStatus;
  /** Ovozli xabar davomiyligi (soniyada) */
  audioDuration?: number;
}

// ── Typing indikator komponenti (3 nuqtali bouncing dots) ──
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="self-start flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-[4px] bg-surface-container shadow-sm max-w-[80px]"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-on-surface-variant/50"
          animate={{ y: [0, -6, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

// ── Read receipt ptichkalar komponenti ──────────────────────
function MessageStatusIcon({
  status,
  mine,
}: {
  status?: MessageStatus;
  mine: boolean;
}) {
  if (!mine || !status) return null;

  // Yuborilmoqda — soat ikonkasi
  if (status === 'SENDING') {
    return (
      <span className="inline-flex items-center ml-1 text-on-primary/50">
        <Icon name="schedule" className="text-[12px]" />
      </span>
    );
  }

  // Xatolik — qizil ogoh
  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center ml-1 text-error">
        <Icon name="error" className="text-[12px]" />
      </span>
    );
  }

  // SENT — bitta ptichka
  if (status === 'SENT') {
    return (
      <span className="inline-flex items-center ml-1 text-on-primary/60">
        <span className="text-[11px]">✓</span>
      </span>
    );
  }

  // DELIVERED — ikkita kulrang ptichka
  if (status === 'DELIVERED') {
    return (
      <span className="inline-flex items-center ml-1 text-on-primary/60">
        <span className="text-[11px]">✓✓</span>
      </span>
    );
  }

  // READ — ikkita ko'k ptichka
  if (status === 'READ') {
    return (
      <span className="inline-flex items-center ml-1 text-sky-300">
        <span className="text-[11px] font-bold">✓✓</span>
      </span>
    );
  }

  return null;
}

// ── Asosiy Chat komponenti ──────────────────────────────────
export default function Chat() {
  const { id: matchId } = useParams();
  const nav = useNavigate();
  const meId = getUserId();

  const [user, setUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [catalog, setCatalog] = useState<GiftItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [lastTap, setLastTap] = useState<{ id: string; time: number } | null>(null);

  // Message actions states
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingEmitRef = useRef(0);

  // ── Rasm tanlash va yuborish ──────────────────────────────
  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !matchId || sending) return;
    if (file.size > 8 * 1024 * 1024) return;
    setSending(true);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const msg = await sendChatImage(matchId, dataUrl);
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  // ── Xabarlarni serverdan yuklash ──────────────────────────
  async function load() {
    if (!matchId) return;
    try {
      getGiftCatalog().then(setCatalog).catch(() => undefined);
      const data = await getMessages(matchId);
      setUser(data.user);
      setOnline(!!data.online);
      // Mavjud xabarlarni status bilan belgilash
      const enriched: ExtendedMessage[] = data.messages.map((m) => ({
        ...m,
        status: m.readAt ? 'READ' : ('DELIVERED' as MessageStatus),
      }));
      setMessages(enriched);
    } catch {
      /* ignore */
    }
  }

  // ── Socket eventlarini eshitish ───────────────────────────
  useEffect(() => {
    load();

    const socket = getSocket();
    if (!socket) return;

    // Yangi xabar kelganda
    const handleNewMessage = (msg: Message) => {
      if (msg.matchId === matchId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, { ...msg, status: 'DELIVERED' as MessageStatus }];
        });

        // Kelgan xabarni o'qilgan deb belgilash (biz chatda turibmiz)
        if (msg.senderId !== meId) {
          emitMessageRead(msg.id, matchId!);
        }
      }
    };

    // Boshqa foydalanuvchi yozyotganida
    const handleTyping = (data: { matchId: string; userId: string; isTyping: boolean }) => {
      if (data.matchId === matchId && data.userId !== meId) {
        setIsPartnerTyping(data.isTyping);

        // 3 sekunddan keyin typing holatini avtomatik o'chirish
        // (agar stop eventi kelmasa)
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3000);
        }
      }
    };

    // Xabar o'qilganligi haqida xabar (read receipt)
    const handleMessageRead = (data: { messageId: string; matchId: string; readAt: string }) => {
      if (data.matchId === matchId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId || (m.senderId === meId && !m.readAt)
              ? { ...m, status: 'READ' as MessageStatus, readAt: data.readAt }
              : m,
          ),
        );
      }
    };

    // Xabar yetkazilganligi haqida xabar
    const handleMessageDelivered = (data: { messageId: string; matchId: string }) => {
      if (data.matchId === matchId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId && m.status === 'SENT'
              ? { ...m, status: 'DELIVERED' as MessageStatus }
              : m,
          ),
        );
      }
    };

    // Xabarga reaksiya (like) haqida
    const handleMessageLiked = (data: { messageId: string; matchId: string; liked: boolean }) => {
      if (data.matchId === matchId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId ? { ...m, liked: data.liked } : m,
          ),
        );
      }
    };

    const handleMessageUpdated = (data: { messageId: string; content: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, content: data.content } : m)),
      );
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);
    socket.on('messageRead', handleMessageRead);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageLiked', handleMessageLiked);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
      socket.off('messageRead', handleMessageRead);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageLiked', handleMessageLiked);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('messageDeleted', handleMessageDeleted);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, meId]);

  // ── Yangi xabar kelganda scroll pastga ────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isPartnerTyping]);

  // ── Typing indikator — foydalanuvchi yozayotganida ────────
  const handleTypingEmit = useCallback(() => {
    if (!matchId) return;
    const now = Date.now();
    // 1 sekund ichida takroriy emit qilmaslik (debounce)
    if (now - lastTypingEmitRef.current < 1000) return;
    lastTypingEmitRef.current = now;
    emitTyping(matchId, true);

    // 2 sekunddan keyin typing to'xtatish signali
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(matchId!, false);
    }, 2000);
  }, [matchId]);

  // ── Xabar yuborish (Optimistic UI bilan) ──────────────────
  async function send(content: string) {
    let body = content.trim();
    if (!body || !matchId || sending) return;

    if (editingMessage) {
      setSending(true);
      try {
        await updateMessage(matchId, editingMessage.id, body);
        setMessages((m) => m.map(x => x.id === editingMessage.id ? { ...x, content: body } : x));
        setEditingMessage(null);
        setText('');
      } catch {
        /* error handling */
      } finally {
        setSending(false);
      }
      return;
    }

    if (replyingMessage) {
      let quote = replyingMessage.content;
      if (quote.includes('\n')) quote = quote.split('\n')[0] + '...';
      body = `> ${quote}\n\n${body}`;
      setReplyingMessage(null);
    }

    setSending(true);
    setText('');

    // Typing to'xtatish
    emitTyping(matchId, false);

    // Vaqtinchalik ID bilan darhol ekranga qo'shish (Optimistic UI)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg: ExtendedMessage = {
      id: tempId,
      matchId,
      senderId: meId!,
      type: 'TEXT',
      content: body,
      readAt: null,
      createdAt: new Date().toISOString(),
      tempId,
      status: 'SENDING',
    };

    setMessages((m) => [...m, optimisticMsg]);

    try {
      const serverMsg = await sendMessage(matchId, body);
      // Server javob berganida vaqtinchalik ID ni haqiqiy ID bilan almashtirish
      setMessages((m) =>
        m.map((msg) =>
          msg.tempId === tempId
            ? { ...serverMsg, tempId: undefined, status: 'SENT' as MessageStatus }
            : msg,
        ),
      );
    } catch {
      // Xatolik — xabarni FAILED deb belgilash
      setMessages((m) =>
        m.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'FAILED' as MessageStatus } : msg,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  // ── Xabarni qayta yuborish ────────────────────────────────
  async function retrySend(tempId: string) {
    const msg = messages.find((m) => m.tempId === tempId);
    if (!msg || !matchId) return;

    // Statusni SENDING ga qaytarish
    setMessages((m) =>
      m.map((x) => (x.tempId === tempId ? { ...x, status: 'SENDING' as MessageStatus } : x)),
    );

    try {
      const serverMsg = await sendMessage(matchId, msg.content);
      setMessages((m) =>
        m.map((x) =>
          x.tempId === tempId
            ? { ...serverMsg, tempId: undefined, status: 'SENT' as MessageStatus }
            : x,
        ),
      );
    } catch {
      setMessages((m) =>
        m.map((x) => (x.tempId === tempId ? { ...x, status: 'FAILED' as MessageStatus } : x)),
      );
    }
  }

  // ── Ovozli xabar yuborish ─────────────────────────────────
  async function sendVoice(blob: Blob, durationSec: number) {
    if (!matchId) return;

    // Blob'ni base64 data URL ga aylantirish
    const dataUrl: string = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });

    // Optimistic UI — darhol ko'rsatish
    const tempId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMsg: ExtendedMessage = {
      id: tempId,
      matchId,
      senderId: meId!,
      type: 'VOICE',
      content: URL.createObjectURL(blob), // Lokal URL — darhol o'ynatish uchun
      readAt: null,
      createdAt: new Date().toISOString(),
      tempId,
      status: 'SENDING',
      audioDuration: durationSec,
    };

    setMessages((m) => [...m, optimisticMsg]);

    try {
      // Ovozli xabarni serverga yuborish (rasm yuborish kabi)
      const serverMsg = await sendChatImage(matchId, dataUrl);
      setMessages((m) =>
        m.map((msg) =>
          msg.tempId === tempId
            ? {
                ...serverMsg,
                tempId: undefined,
                status: 'SENT' as MessageStatus,
                audioDuration: durationSec,
              }
            : msg,
        ),
      );
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'FAILED' as MessageStatus } : msg,
        ),
      );
    }
  }

  // ── Delete message action ────────────────────────────────
  async function doDeleteMessage(msg: Message) {
    if (!matchId) return;
    try {
      await deleteMessage(matchId, msg.id);
      setMessages((m) => m.filter((x) => x.id !== msg.id));
    } catch {
      //
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex flex-col bg-surface">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex justify-between items-center px-margin-main h-14 bg-surface/70 backdrop-blur-xl border-b border-surface-container-high/50">
        <button
          onClick={() => nav('/messages')}
          aria-label="Orqaga"
          className="p-2 -ml-2 text-primary press"
        >
          <Icon name="arrow_back_ios" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-body-lg font-body-lg font-semibold text-on-surface">
            {user?.firstName ?? '...'}
          </h1>
          {/* Online holati yoki typing indikator */}
          {isPartnerTyping ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-label-caps font-label-caps text-primary"
            >
              yozyapti...
            </motion.span>
          ) : online ? (
            <span className="flex items-center gap-1 text-label-caps font-label-caps text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> onlayn
            </span>
          ) : (
            <span className="text-label-caps font-label-caps text-on-surface-variant">
              oflayn
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 -mr-1">
          <Avatar url={user?.photos[0]?.url} name={user?.firstName} className="w-9 h-9" />
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Boshqa"
            className="w-9 h-9 flex items-center justify-center text-on-surface press"
          >
            <Icon name="more_vert" />
          </button>
        </div>
      </header>

      {user && (
        <UserActionsSheet
          userId={user.id}
          userName={user.firstName}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onBlocked={() => nav('/messages')}
        />
      )}

      <MessageActionsSheet
        message={actionMessage}
        open={!!actionMessage}
        onClose={() => setActionMessage(null)}
        onEdit={(msg) => {
          setEditingMessage(msg);
          setText(msg.content.replace(/^> .*?\n\n/s, '')); // O'zgartirmoqchi bo'lsa, qavsdan chiqarish kerak. Lekin edit odatda oxirgi textda bo'ladi.
          setTimeout(() => document.querySelector('textarea')?.focus(), 100);
        }}
        onDelete={doDeleteMessage}
        onReply={(msg) => {
          setReplyingMessage(msg);
          setTimeout(() => document.querySelector('textarea')?.focus(), 100);
        }}
      />

      {/* ── Xabarlar sohasi ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-margin-main pt-[72px] pb-[150px] flex flex-col gap-3 no-scrollbar">
        {/* Bo'sh holat */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center mt-12 gap-2">
            <Icon name="waving_hand" fill className="text-[40px] text-primary" />
            <p className="text-body-md font-body-md text-on-surface-variant max-w-[240px]">
              Match bo'ldingiz! Suhbatni boshlang.
            </p>
          </div>
        )}

        {/* Xabarlar ro'yxati */}
        {messages.map((m) => {
          const mine = m.senderId === meId;

          const handleDoubleTap = () => {
            const now = Date.now();
            if (lastTap && lastTap.id === m.id && now - lastTap.time < 300) {
              // Double tap detected!
              if (!m.tempId && matchId) {
                const newLikedStatus = !m.liked;
                // Optimistic UI for like
                setMessages((prev) =>
                  prev.map((x) => (x.id === m.id ? { ...x, liked: newLikedStatus } : x))
                );
                emitLikeMessage(m.id, matchId, newLikedStatus);
              }
              setLastTap(null);
            } else {
              setLastTap({ id: m.id, time: now });
            }
          };

          // ── Rasm xabari ──
          if (m.type === 'IMAGE') {
            return (
              <motion.div
                key={m.id}
                {...bubbleIn(mine)}
                className={`flex flex-col max-w-[70%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div
                  className={`rounded-2xl overflow-hidden shadow-sm ${
                    mine ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'
                  }`}
                >
                  <img
                    src={photoUrl(m.content)}
                    className="w-full max-h-[300px] object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Rasm xabari uchun vaqt va status */}
                <div className="flex items-center gap-0.5 mt-0.5 px-1">
                  <span className="text-[10px] text-on-surface-variant/70">
                    {clockTime(m.createdAt)}
                  </span>
                  <MessageStatusIcon status={m.status} mine={mine} />
                </div>
              </motion.div>
            );
          }

          // ── Sovg'a xabari ──
          if (m.type === 'GIFT') {
            const giftInfo = catalog.find((g) => g.key === m.content);
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className={`flex flex-col ${
                  mine ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-inner ring-1 ring-primary/10">
                  {giftInfo?.imageUrl ? (
                    <img
                      src={photoUrl(giftInfo.imageUrl)}
                      alt={giftInfo.name}
                      className="w-20 h-20 object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div className="text-[56px] leading-none">🎁</div>
                  )}
                </div>
                <span className="text-label-md font-label-md text-on-surface mt-1.5">
                  {giftInfo?.name ?? "Sovg'a"}
                </span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">
                  {mine ? "Siz yubordingiz" : "Sizga yuborildi"} · {clockTime(m.createdAt)}
                </span>
              </motion.div>
            );
          }

          // ── Ovozli xabar ──
          if (m.type === 'VOICE') {
            return (
              <motion.div
                key={m.id}
                {...bubbleIn(mine)}
                className={`flex flex-col max-w-[85%] ${
                  mine ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`px-3 py-2.5 rounded-2xl shadow-sm ${
                    mine
                      ? 'bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-br-[4px]'
                      : 'bg-surface-container text-on-surface rounded-bl-[4px]'
                  }`}
                >
                  <AudioWaveform
                    src={m.tempId ? m.content : photoUrl(m.content)}
                    duration={m.audioDuration}
                    mine={mine}
                  />
                  {/* Vaqt va status */}
                  <div
                    className={`flex items-center justify-end gap-0.5 mt-1 ${
                      mine ? 'text-on-primary/80' : 'text-on-surface-variant/70'
                    }`}
                  >
                    <span className="text-[10px]">{clockTime(m.createdAt)}</span>
                    <MessageStatusIcon status={m.status} mine={mine} />
                  </div>
                </div>

                {/* Xatolik — Qayta yuborish tugmasi */}
                {m.status === 'FAILED' && m.tempId && (
                  <motion.button
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => retrySend(m.tempId!)}
                    className="flex items-center gap-1 mt-1 px-2 py-1 text-error text-label-sm font-label-sm press"
                  >
                    <Icon name="refresh" className="text-[14px]" />
                    Qayta yuborish
                  </motion.button>
                )}
              </motion.div>
            );
          }

          // ── Matnli xabar (asosiy) ──
          const parts = m.content.split('\n\n');
          const isReply = m.content.startsWith('> ') && parts.length >= 2;
          const quote = isReply ? parts[0].substring(2) : null;
          const actualText = isReply ? parts.slice(1).join('\n\n') : m.content;

          return (
            <motion.div
              key={m.id}
              {...bubbleIn(mine)}
              className={`flex flex-col max-w-[85%] ${
                mine ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div
                onClick={handleDoubleTap}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActionMessage(m);
                }}
                className={`relative px-4 py-3 rounded-2xl shadow-sm cursor-pointer select-none ${
                  mine
                    ? 'bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-br-[4px]'
                    : 'bg-surface-container text-on-surface rounded-bl-[4px]'
                }`}
              >
                {isReply && (
                  <div className={`mb-2 pl-2 border-l-2 ${mine ? 'border-primary-container text-primary-container/80' : 'border-primary text-primary/80'} text-xs font-medium`}>
                    {quote}
                  </div>
                )}
                <p className="text-body-md font-body-md leading-relaxed whitespace-pre-wrap">
                  {actualText}
                </p>
                {/* Vaqt va read receipt status */}
                <div
                  className={`flex items-center justify-end gap-0.5 mt-1 ${
                    mine ? 'text-on-primary/80' : 'text-on-surface-variant/70'
                  }`}
                >
                  <span className="text-[10px]">{clockTime(m.createdAt)}</span>
                  <MessageStatusIcon status={m.status} mine={mine} />
                </div>
                
                {/* Like animatsiyasi */}
                <AnimatePresence>
                  {m.liked && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className={`absolute -bottom-2 -right-2 bg-surface rounded-full p-1 shadow-sm border border-surface-container-high ${mine ? 'text-primary' : 'text-error'}`}
                    >
                      <Icon name="favorite" fill className="text-[16px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Xatolik — Qayta yuborish tugmasi */}
              {m.status === 'FAILED' && m.tempId && (
                <motion.button
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => retrySend(m.tempId!)}
                  className="flex items-center gap-1 mt-1 px-2 py-1 text-error text-label-sm font-label-sm press"
                >
                  <Icon name="refresh" className="text-[14px]" />
                  Qayta yuborish
                </motion.button>
              )}
            </motion.div>
          );
        })}

        {/* ── Typing indikator (boshqa foydalanuvchi yozyotganda) ─── */}
        <AnimatePresence>
          {isPartnerTyping && <TypingIndicator />}
        </AnimatePresence>

        <div ref={endRef} />
      </main>

      {/* ── Input sohasi ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-container-highest/30 pb-safe-bottom">
        {/* Icebreakers — faqat birinchi xabar uchun */}
        {messages.length === 0 && (
          <div className="flex overflow-x-auto no-scrollbar px-margin-main py-2.5 gap-2">
            {ICEBREAKERS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="px-4 py-1.5 rounded-full bg-surface-bright border border-surface-container-highest text-label-sm font-label-sm text-on-surface whitespace-nowrap press"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {(replyingMessage || editingMessage) && (
          <div className="flex items-center justify-between px-margin-main py-2 bg-surface-container-low border-b border-surface-container-highest/50">
            <div className="flex items-center gap-2 overflow-hidden">
              <Icon name={editingMessage ? 'edit' : 'reply'} className="text-[18px] text-primary" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-primary">
                  {editingMessage ? "Tahrirlash" : "Javob berish"}
                </span>
                <span className="text-label-sm text-on-surface-variant truncate max-w-[200px]">
                  {(editingMessage || replyingMessage)?.type === 'TEXT'
                    ? (editingMessage || replyingMessage)?.content.split('\n\n').pop()
                    : (editingMessage || replyingMessage)?.type === 'IMAGE' ? "📷 Rasm" : "🎤 Ovozli xabar"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setReplyingMessage(null);
                setText('');
              }}
              className="p-2 -mr-2 text-on-surface-variant press"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        )}

        <div className="flex items-end px-margin-main py-3 gap-2">
          {/* Rasm tanlash */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Rasm yuborish"
            disabled={sending}
            className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary press shrink-0 mb-0.5 disabled:opacity-50"
          >
            <Icon name="add_photo_alternate" className="text-[22px]" />
          </button>

          {/* Matn kiritish maydoni */}
          <div className="flex-1 bg-surface-container border border-surface-container-highest rounded-[20px] flex items-end pl-4 pr-1 min-h-[44px]">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Typing indikator — har yozganida emit qilish (debounce bilan)
                handleTypingEmit();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              placeholder="Xabar yozing..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-[100px] py-3 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 outline-none"
            />
            {/* Sovg'a tugmasi */}
            <button
              onClick={() => nav(`/gifts/${matchId}`)}
              aria-label="Sovg'a yuborish"
              className="p-2 mb-0.5 text-primary press relative"
            >
              <Icon name="featured_seasonal_and_gifts" fill className="text-[24px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-deep rounded-full" />
            </button>
          </div>

          {/* Mikrofon / Yuborish tugmasi */}
          {text.trim() ? (
            <motion.button
              onClick={() => send(text)}
              disabled={!text.trim() || sending}
              aria-label="Yuborish"
              whileTap={{ scale: 0.85 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 mb-0.5"
            >
              <Icon name="send" className="text-[20px] ml-0.5" />
            </motion.button>
          ) : (
            /* Matn bo'sh bo'lganda — mikrofon tugmasi */
            <AudioRecorder onRecorded={sendVoice} disabled={sending} />
          )}
        </div>
      </div>
    </div>
  );
}
