import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import { deleteAccount } from '@/lib/data';
import { getMe, updateProfile } from '@/lib/auth';
import { Icon } from '@/components/Icon';
import { LEGAL_LINKS } from './legal/legalContent';

export default function Settings() {
  const nav = useNavigate();
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSender, setShowSender] = useState<boolean | null>(null);

  useEffect(() => {
    getMe()
      .then((m) => setShowSender(m.notifyShowSender))
      .catch(() => setShowSender(false));
  }, []);

  async function toggleSender() {
    const next = !showSender;
    setShowSender(next); // optimistik
    try {
      await updateProfile({ notifyShowSender: next });
    } catch {
      setShowSender(!next); // qaytarish
    }
  }

  function handleLogout() {
    disconnectSocket();
    clearToken();
    nav('/');
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      disconnectSocket();
      clearToken();
      nav('/');
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-outline-variant/30 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
        <button onClick={() => nav(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-variant/50 text-on-surface press">
          <Icon name="arrow_back" className="text-[24px]" />
        </button>
        <h1 className="text-title-lg font-title-lg text-on-surface ml-2">Sozlamalar</h1>
      </div>

      <div className="flex-1 p-margin-main flex flex-col gap-4">
        <div className="bg-surface-variant/30 rounded-2xl p-4 border border-outline-variant/30">
          <h2 className="text-title-md font-title-md text-on-surface mb-2">Hisob</h2>
          <button
            onClick={() => nav('/profile/edit')}
            className="w-full h-[48px] rounded-button bg-surface-container text-on-surface text-label-lg font-label-lg press flex items-center justify-between px-4 mb-3"
          >
            <span className="flex items-center gap-2">
              <Icon name="person" className="text-[20px] text-primary" />
              Profilni tahrirlash
            </span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full h-[48px] rounded-button border border-error text-error text-label-lg font-label-lg press flex items-center justify-center gap-2"
          >
            <Icon name="logout" className="text-[20px]" />
            Tizimdan chiqish
          </button>

          <button
            onClick={() => setConfirmDel(true)}
            className="w-full h-[44px] mt-3 text-on-surface-variant text-label-md press flex items-center justify-center gap-2"
          >
            <Icon name="delete_forever" className="text-[18px]" />
            Akkauntni o'chirish
          </button>
        </div>

        {/* Bildirishnoma maxfiyligi */}
        <div className="bg-surface-variant/30 rounded-2xl p-4 border border-outline-variant/30">
          <h2 className="text-title-md font-title-md text-on-surface mb-2">Bildirishnoma</h2>
          <button
            onClick={toggleSender}
            disabled={showSender === null}
            className="w-full flex items-center justify-between gap-3 py-2 press disabled:opacity-50"
          >
            <span className="flex flex-col items-start text-left">
              <span className="text-label-lg font-label-lg text-on-surface">Telegram bildirishnomada ism</span>
              <span className="text-label-md text-on-surface-variant">
                {showSender
                  ? '"Falonchi sizga xabar yubordi" ko\'rinadi'
                  : 'Yashirin: "Sizga yangi xabar bor" (ism ko\'rinmaydi)'}
              </span>
            </span>
            <span
              className={`shrink-0 w-12 h-7 rounded-full transition-colors relative ${
                showSender ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  showSender ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>
        </div>

        {/* Yuridik hujjatlar */}
        <div className="bg-surface-variant/30 rounded-2xl p-4 border border-outline-variant/30">
          <h2 className="text-title-md font-title-md text-on-surface mb-3">Hujjatlar</h2>
          <div className="flex flex-col">
            {LEGAL_LINKS.map((doc, i) => (
              <button
                key={doc.slug}
                onClick={() => nav(`/legal/${doc.slug}`)}
                className={`w-full h-[52px] flex items-center justify-between press ${
                  i > 0 ? 'border-t border-outline-variant/20' : ''
                }`}
              >
                <span className="flex items-center gap-3 text-body-md font-body-md text-on-surface">
                  <Icon name="description" className="text-[20px] text-on-surface-variant" />
                  {doc.title}
                </span>
                <Icon name="chevron_right" className="text-on-surface-variant" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-label-sm text-on-surface-variant/60 mt-2">
          Diydor · INNASOFT MChJ
        </p>
      </div>

      {/* Akkaunt o'chirish tasdig'i */}
      {confirmDel && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center px-6 max-w-[480px] mx-auto">
          <div className="bg-surface rounded-[28px] p-6 w-full max-w-[340px] spring-in">
            <div className="flex flex-col items-center text-center gap-2 mb-5">
              <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center text-error mb-1">
                <Icon name="warning" fill className="text-[28px]" />
              </div>
              <h3 className="text-headline-md font-headline-md text-on-surface">Akkauntni o'chirish</h3>
              <p className="text-body-md text-on-surface-variant">
                Barcha ma'lumotlaringiz (profil, suhbatlar, rasmlar) butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full h-[52px] rounded-xl bg-error text-on-error font-semibold press flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {deleting ? <Icon name="progress_activity" className="animate-spin" /> : "Ha, o'chirish"}
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              disabled={deleting}
              className="w-full h-[48px] mt-2 text-on-surface-variant text-label-lg press"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
