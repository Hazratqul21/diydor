import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { UserActionsSheet } from '@/components/UserActionsSheet';

// Xabar bubble kirish animatsiyasi
const bubbleIn = (mine: boolean) => ({
  initial: { opacity: 0, y: 10, x: mine ? 14 : -14, scale: 0.96 },
  animate: { opacity: 1, y: 0, x: 0, scale: 1 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 26 },
});
import { getUserId } from '@/lib/api';
import { getMessages, sendMessage, sendChatImage, photoUrl, GIFT_EMOJI, type Message, type Profile } from '@/lib/data';
import { getSocket } from '@/lib/socket';
import { clockTime } from '@/lib/time';

const ICEBREAKERS = ['Salom! Qalaysiz? 👋', 'Qaysi joylarga borishni yoqtirasiz?', 'Bugun kayfiyat qanday?'];

export default function Chat() {
  const { id: matchId } = useParams();
  const nav = useNavigate();
  const meId = getUserId();
  const [user, setUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function load() {
    if (!matchId) return;
    try {
      const data = await getMessages(matchId);
      setUser(data.user);
      setOnline(!!data.online);
      setMessages(data.messages);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    
    const socket = getSocket();
    if (!socket) return;
    
    const handleNewMessage = (msg: Message) => {
      if (msg.matchId === matchId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };
    
    socket.on('newMessage', handleNewMessage);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [matchId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(content: string) {
    const body = content.trim();
    if (!body || !matchId || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage(matchId, body);
      setMessages((m) => [...m, msg]);
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex justify-between items-center px-margin-main h-14 bg-surface/70 backdrop-blur-xl border-b border-surface-container-high/50">
        <button onClick={() => nav('/messages')} aria-label="Orqaga" className="p-2 -ml-2 text-primary press">
          <Icon name="arrow_back_ios" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-body-lg font-body-lg font-semibold text-on-surface">{user?.firstName ?? '...'}</h1>
          {online ? (
            <span className="flex items-center gap-1 text-label-caps font-label-caps text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> onlayn
            </span>
          ) : (
            <span className="text-label-caps font-label-caps text-on-surface-variant">oflayn</span>
          )}
        </div>
        <div className="flex items-center gap-1 -mr-1">
          <Avatar url={user?.photos[0]?.url} name={user?.firstName} className="w-9 h-9" />
          <button onClick={() => setMenuOpen(true)} aria-label="Boshqa" className="w-9 h-9 flex items-center justify-center text-on-surface press">
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

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-margin-main pt-[72px] pb-[150px] flex flex-col gap-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center mt-12 gap-2">
            <Icon name="waving_hand" fill className="text-[40px] text-primary" />
            <p className="text-body-md font-body-md text-on-surface-variant max-w-[240px]">
              Match bo'ldingiz! Suhbatni boshlang.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          if (m.type === 'IMAGE') {
            return (
              <motion.div key={m.id} {...bubbleIn(mine)} className={`flex max-w-[70%] ${mine ? 'self-end' : 'self-start'}`}>
                <div className={`rounded-2xl overflow-hidden shadow-sm ${mine ? 'rounded-br-[4px]' : 'rounded-bl-[4px]'}`}>
                  <img src={photoUrl(m.content)} className="w-full max-h-[300px] object-cover" loading="lazy" />
                </div>
              </motion.div>
            );
          }
          if (m.type === 'GIFT') {
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className={`flex flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div className="text-[64px] leading-none animate-bounce">{GIFT_EMOJI[m.content] ?? '🎁'}</div>
                <span className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                  {mine ? 'Siz sovg\'a yubordingiz' : 'Sizga sovg\'a yubordi'} · {clockTime(m.createdAt)}
                </span>
              </motion.div>
            );
          }
          return (
            <motion.div key={m.id} {...bubbleIn(mine)} className={`flex max-w-[85%] ${mine ? 'self-end' : 'self-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm ${
                  mine
                    ? 'bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-br-[4px]'
                    : 'bg-surface-container text-on-surface rounded-bl-[4px]'
                }`}
              >
                <p className="text-body-md font-body-md leading-relaxed whitespace-pre-wrap">{m.content}</p>
                <span className={`text-[10px] block text-right mt-1 ${mine ? 'text-on-primary/80' : 'text-on-surface-variant/70'}`}>
                  {clockTime(m.createdAt)}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* Input */}
      <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-container-highest/30 pb-safe-bottom">
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
        <div className="flex items-end px-margin-main py-3 gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Rasm yuborish"
            disabled={sending}
            className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary press shrink-0 mb-0.5 disabled:opacity-50"
          >
            <Icon name="add_photo_alternate" className="text-[22px]" />
          </button>
          <div className="flex-1 bg-surface-container border border-surface-container-highest rounded-[20px] flex items-end pl-4 pr-1 min-h-[44px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
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
            {/* Sovg'a (post-match) — sovg'a do'koniga */}
            <button
              onClick={() => nav(`/gifts/${matchId}`)}
              aria-label="Sovg'a yuborish"
              className="p-2 mb-0.5 text-primary press relative"
            >
              <Icon name="featured_seasonal_and_gifts" fill className="text-[24px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-deep rounded-full" />
            </button>
          </div>
          <motion.button
            onClick={() => send(text)}
            disabled={!text.trim() || sending}
            aria-label="Yuborish"
            whileTap={{ scale: 0.85 }}
            animate={{ scale: text.trim() ? 1 : 0.92, opacity: text.trim() ? 1 : 0.5 }}
            className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 mb-0.5"
          >
            <Icon name="send" className="text-[20px] ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
