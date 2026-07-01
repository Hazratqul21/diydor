import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { getMatches, photoUrl, type MatchSummary, type Message } from '@/lib/data';
import { getSocket } from '@/lib/socket';
import { shortTime } from '@/lib/time';

export default function Messages() {
  const nav = useNavigate();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      getMatches()
        .then(setMatches)
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    }
    load();

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMatches((prev) => {
        const idx = prev.findIndex(m => m.matchId === msg.matchId);
        if (idx === -1) {
          load(); // reload if unknown match
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: msg,
          unread: updated[idx].unread + 1,
        };
        return updated;
      });
    };

    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, []);

  const fresh = matches.filter((m) => !m.lastMessage);
  const convos = matches.filter((m) => m.lastMessage);

  return (
    <div className="min-h-screen pb-[100px]">
      <header className="fixed top-0 w-full max-w-[480px] mx-auto z-50 flex items-center px-margin-main h-14 bg-surface/70 backdrop-blur-xl">
        <h1 className="text-headline-md font-headline-md text-on-surface">Xabarlar</h1>
      </header>

      <main className="pt-[72px]">
        {loading ? (
          <div className="px-margin-main space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <Empty onGo={() => nav('/discover')} />
        ) : (
          <>
            {fresh.length > 0 && (
              <section className="pl-margin-main mb-stack-lg">
                <h2 className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-widest mb-stack-sm">
                  Yangi juftliklar
                </h2>
                <div className="flex overflow-x-auto gap-stack-md pr-margin-main pb-2 no-scrollbar">
                  {fresh.map((m, i) => (
                    <motion.button
                      key={m.matchId}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => nav(`/chat/${m.matchId}`)}
                      className="flex flex-col items-center gap-2 min-w-[72px]"
                    >
                      <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-primary to-primary-container">
                        <Avatar profile={m.user} className="w-full h-full border-2 border-surface" />
                      </div>
                      <span className="text-label-sm font-label-sm text-on-surface truncate w-full text-center">
                        {m.user.firstName}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {convos.length > 0 && <div className="mx-margin-main h-px bg-surface-variant/50 mb-stack-md" />}

            <section className="px-margin-main flex flex-col gap-1">
              {convos.map((m, i) => (
                <motion.button
                  key={m.matchId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => nav(`/chat/${m.matchId}`)}
                  className="flex items-center gap-gutter p-2 -mx-2 rounded-xl hover:bg-surface-subtle text-left"
                >
                  <Avatar profile={m.user} className="w-14 h-14 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3
                        className={`text-body-lg font-body-lg truncate ${m.unread ? 'font-semibold text-on-surface' : 'text-on-surface'}`}
                      >
                        {m.user.firstName}
                      </h3>
                      <span
                        className={`text-label-sm font-label-sm ml-2 shrink-0 ${m.unread ? 'text-primary' : 'text-on-surface-variant'}`}
                      >
                        {shortTime(m.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-body-md font-body-md truncate mr-2 ${m.unread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}
                      >
                        {m.lastMessage?.type === 'IMAGE'
                          ? '📷 Rasm'
                          : m.lastMessage?.type === 'GIFT'
                            ? '🎁 Sovg\'a'
                            : m.lastMessage?.content}
                      </p>
                      {m.unread > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                          className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-on-primary text-[11px] font-bold shrink-0"
                        >
                          {m.unread}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Avatar({ profile, className = '' }: { profile: { firstName: string; photos: { url: string }[] }; className?: string }) {
  const p = profile.photos[0];
  const [failed, setFailed] = useState(false);
  const initial = (profile.firstName?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <div className={`rounded-full overflow-hidden bg-primary/15 flex items-center justify-center ${className}`}>
      {p && !failed ? (
        <img
          src={photoUrl(p.url)}
          alt={profile.firstName}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-title-md text-primary select-none">{initial}</span>
      )}
    </div>
  );
}

function Empty({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-stack-md px-8 mt-32">
      <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
        <Icon name="chat_bubble" className="text-[40px]" />
      </div>
      <h2 className="text-headline-md font-headline-md text-on-surface">Hali suhbat yo'q</h2>
      <p className="text-body-md font-body-md text-on-surface-variant">
        Birinchi match'ingizni toping va suhbatni boshlang.
      </p>
      <button onClick={onGo} className="mt-2 h-[48px] px-6 rounded-button bg-primary text-on-primary font-body-md press">
        Svaypga qaytish
      </button>
    </div>
  );
}
