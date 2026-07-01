import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Welcome from './screens/Welcome';
import Gender from './screens/onboarding/Gender';
import Age from './screens/onboarding/Age';
import Intent from './screens/onboarding/Intent';
import Photos from './screens/onboarding/Photos';
import Selfie from './screens/onboarding/Selfie';
import Verified from './screens/onboarding/Verified';
import Discover from './screens/Discover';
import Messages from './screens/Messages';
import Chat from './screens/Chat';
import MyProfile from './screens/MyProfile';
import Likes from './screens/Likes';
import ProfileDetail from './screens/ProfileDetail';
import GiftStore from './screens/GiftStore';
import CoinStore from './screens/CoinStore';
import Wallet from './screens/Wallet';
import Withdraw from './screens/Withdraw';
import Placeholder from './screens/Placeholder';
import Settings from './screens/Settings';
import EditProfile from './screens/EditProfile';
import Subscription from './screens/Subscription';
import LegalPage from './screens/legal/LegalPage';
import { OfflineBanner } from './components/OfflineBanner';
import { tmaReady, lockTmaScroll, isTMA } from './lib/tma';
import { ensureSocketConnection } from './lib/socket';
import { getToken } from './lib/api';

/**
 * Diydor ilova. Desktopda telefon-freym (max-w-480) ko'rinadi,
 * mobilda butun ekran. Real qurilmada Capacitor bilan o'raladi.
 * Telegram Mini App (TMA) ichida ochilganda nativ integratsiya ishlaydi.
 */
export default function App() {
  // ── Ilova yuklanishida TMA va socketni sozlash ──
  useEffect(() => {
    // Telegram Mini App ichida bo'lsa, nativ sozlamalarni yoqish
    if (isTMA()) {
      tmaReady();
      lockTmaScroll();
    }
    // WebSocket ulanishni tiklash
    ensureSocketConnection();

    // Kunlik bonusni tekshirish
    if (getToken()) {
      import('./lib/data').then(({ claimDailyBonus }) => {
        claimDailyBonus().then((res) => {
          if (res.success && res.bonusAmount > 0) {
            import('./lib/tma').then(({ hapticSuccess }) => hapticSuccess());
            // Optional: You could show a toast or alert here for the daily bonus
            console.log(`Tabriklaymiz! Kunlik bonus: ${res.bonusAmount} tanga!`);
          }
        }).catch(() => {});
      });
    }
  }, []);
  return (
    <div className="mx-auto max-w-[480px] min-h-screen bg-surface relative overflow-x-hidden md:shadow-[0_20px_70px_-15px_rgb(43_36_33_/_0.35)] md:ring-1 md:ring-on-surface/5">
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Welcome />} />

        {/* Onboarding */}
        <Route path="/onboarding/gender" element={<Gender />} />
        <Route path="/onboarding/age" element={<Age />} />
        <Route path="/onboarding/intent" element={<Intent />} />
        <Route path="/onboarding/photos" element={<Photos />} />
        <Route path="/onboarding/verify" element={<Selfie />} />
        <Route path="/onboarding/done" element={<Verified />} />

        {/* Asosiy ilova */}
        <Route path="/discover" element={<Discover />} />
        <Route path="/likes" element={<Likes />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/u/:userId" element={<ProfileDetail />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/legal/:slug" element={<LegalPage />} />

        {/* Monetizatsiya */}
        <Route path="/gifts/:matchId" element={<GiftStore />} />
        <Route path="/coins" element={<CoinStore />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/wallet/withdraw" element={<Withdraw />} />

        <Route path="*" element={<Placeholder title="Sahifa topilmadi" next="/" />} />
      </Routes>
    </div>
  );
}
