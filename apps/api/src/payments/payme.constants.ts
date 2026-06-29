// Payme Merchant API konstantalari (rasmiy hujjat bo'yicha)

/** JSON-RPC + Payme xato kodlari */
export const PaymeErrorCode = {
  // Global (RPC)
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidAuth: -32504,
  Internal: -32400,
  // Tranzaksiya
  InvalidAmount: -31001,
  TransactionNotFound: -31003,
  CantCancel: -31007, // tovar to'liq berilgan
  CantDoOperation: -31008,
  // Account/order xatolari diapazoni: -31050..-31099
  OrderNotFound: -31050,
} as const;

/** Tranzaksiya holatlari */
export const TransactionState = {
  Created: 1,
  Paid: 2,
  CancelledAfterCreate: -1,
  CancelledAfterPaid: -2,
} as const;

/** Bekor qilish sabablari (Payme kodlari) */
export const CancelReason = {
  RecipientNotFound: 1,
  DebitError: 2,
  TransactionError: 3,
  Timeout: 4,
  Refund: 5,
  Unknown: 10,
} as const;

/** state=1 tranzaksiya ko'pi bilan 12 soat yashaydi (ms) */
export const TRANSACTION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export type PaymeMethod =
  | 'CheckPerformTransaction'
  | 'CreateTransaction'
  | 'PerformTransaction'
  | 'CancelTransaction'
  | 'CheckTransaction'
  | 'GetStatement';
