// Sovg'a iqtisodiyoti konstantalari (MVP — narxlar keyin sozlanadi)

/** 1 tanga ≈ shuncha so'm (sotib olish qiymati) */
export const COIN_TO_SOM = 100;
/** Oluvchiga sovg'a qiymatining ulushi (qolgani platformaga) */
export const RECEIVER_SHARE = 0.5;

export interface GiftItem {
  key: string;
  name: string;
  icon: string; // Material Symbol
  emoji: string;
  coinPrice: number;
  premium?: boolean;
}

export const GIFT_CATALOG: GiftItem[] = [
  { key: 'rose', name: 'Atirgul', icon: 'local_florist', emoji: '🌹', coinPrice: 10 },
  { key: 'heart', name: 'Yurak', icon: 'favorite', emoji: '❤️', coinPrice: 15 },
  { key: 'tulip', name: 'Lola', icon: 'filter_vintage', emoji: '🌷', coinPrice: 20 },
  { key: 'chocolate', name: 'Shokolad', icon: 'cookie', emoji: '🍫', coinPrice: 35 },
  { key: 'teddy', name: 'Ayiqcha', icon: 'cruelty_free', emoji: '🧸', coinPrice: 50 },
  { key: 'ring', name: 'Uzuk', icon: 'diamond', emoji: '💍', coinPrice: 100, premium: true },
];

export interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  priceSom: number;
  popular?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'p100', coins: 100, bonus: 0, priceSom: 10_000 },
  { id: 'p500', coins: 500, bonus: 50, priceSom: 45_000, popular: true },
  { id: 'p1000', coins: 1000, bonus: 150, priceSom: 80_000 },
];

export function findGift(key: string): GiftItem | undefined {
  return GIFT_CATALOG.find((g) => g.key === key);
}
export function findPackage(id: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((p) => p.id === id);
}
