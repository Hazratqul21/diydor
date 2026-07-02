import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';

interface ChatUser { id: string; firstName: string; username: string | null; gender: string | null }
interface ChatMsg { id: string; senderId: string; content: string; type: string; createdAt: string }
interface ChatRow {
  id: string;
  createdAt: string;
  closed: boolean;
  userA: ChatUser;
  userB: ChatUser;
  messageCount: number;
  lastMessage: ChatMsg | null;
}

function preview(m: ChatMsg | null): string {
  if (!m) return "Hali xabar yo'q";
  if (m.type === 'IMAGE') return '📷 Rasm';
  if (m.type === 'GIFT') return "🎁 Sovg'a";
  if (m.type === 'VOICE') return '🎤 Ovozli xabar';
  return m.content;
}

export default function Chats() {
  const [items, setItems] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<ChatRow | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    api<{ items: ChatRow[] }>('/admin/chats')
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function view(c: ChatRow) {
    setOpen(c);
    setMsgLoading(true);
    api<{ messages: ChatMsg[] }>(`/admin/chats/${c.id}/messages`)
      .then((r) => setMsgs(r.messages))
      .catch(() => setMsgs([]))
      .finally(() => setMsgLoading(false));
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Suhbatlar</h1>
      <p className="text-black/50 mb-6">Foydalanuvchilar o'rtasidagi chatlarni moderatsiya qilish</p>

      {loading ? (
        <div className="p-8 text-center text-black/40">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-12 text-center text-black/40">
          <Icon name="forum" className="text-[40px] mb-2" />
          <p>Hali suhbatlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => view(c)}
              className="w-full text-left bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-4 hover:border-black/15"
            >
              <div className="w-10 h-10 rounded-xl bg-[#BE4A2E]/10 text-[#BE4A2E] flex items-center justify-center shrink-0">
                <Icon name="forum" className="text-[20px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">
                  {c.userA.firstName} <span className="text-black/30">↔</span> {c.userB.firstName}
                  {c.closed && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-black/10 text-black/50">Yopilgan</span>}
                </div>
                <div className="text-sm text-black/50 truncate">{preview(c.lastMessage)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-black/40">{c.messageCount} xabar</div>
                <div className="text-xs text-black/30">{new Date(c.createdAt).toLocaleDateString('ru-RU')}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Suhbat oynasi */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
              <div className="font-semibold">{open.userA.firstName} ↔ {open.userB.firstName}</div>
              <button onClick={() => setOpen(null)} className="p-1 text-black/50"><Icon name="close" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {msgLoading ? (
                <div className="text-center text-black/40 py-8">Yuklanmoqda...</div>
              ) : msgs.length === 0 ? (
                <div className="text-center text-black/40 py-8">Xabar yo'q</div>
              ) : (
                msgs.map((m) => {
                  const fromA = m.senderId === open.userA.id;
                  return (
                    <div key={m.id} className={`flex ${fromA ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${fromA ? 'bg-black/5 text-black' : 'bg-[#BE4A2E] text-white'}`}>
                        <div className="text-[10px] opacity-60 mb-0.5">{fromA ? open.userA.firstName : open.userB.firstName}</div>
                        {preview(m)}
                        <div className="text-[10px] opacity-50 mt-0.5">{new Date(m.createdAt).toLocaleString('ru-RU')}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
