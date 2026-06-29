import { PaymeErrorCode } from './payme.constants';

export interface LocalizedMessage {
  ru: string;
  uz: string;
  en: string;
}

/**
 * Payme JSON-RPC xatosi. Controller buni tutib, HTTP 200 + RPC error
 * formatida qaytaradi. Account/order xatolari uchun `message` lokalizatsiya
 * (object) va `data` = account subfield nomi bo'lishi shart.
 */
export class PaymeException extends Error {
  constructor(
    public readonly code: number,
    public readonly rpcMessage: string | LocalizedMessage,
    public readonly data?: string,
  ) {
    super(typeof rpcMessage === 'string' ? rpcMessage : rpcMessage.en);
  }
}

/** Order/account topilmadi (-31050, lokalizatsiya majburiy) */
export function orderNotFound(field = 'order_id'): PaymeException {
  return new PaymeException(
    PaymeErrorCode.OrderNotFound,
    { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' },
    field,
  );
}

/** Bir order uchun boshqa faol tranzaksiya bor */
export function orderInProgress(field = 'order_id'): PaymeException {
  return new PaymeException(
    PaymeErrorCode.OrderNotFound + 49, // -31051: order allaqachon to'lov jarayonida
    { ru: 'Заказ в процессе оплаты', uz: 'Buyurtma to‘lov jarayonida', en: 'Order is in progress' },
    field,
  );
}

export function invalidAmount(): PaymeException {
  return new PaymeException(PaymeErrorCode.InvalidAmount, {
    ru: 'Неверная сумма',
    uz: 'Noto‘g‘ri summa',
    en: 'Invalid amount',
  });
}

export function transactionNotFound(): PaymeException {
  return new PaymeException(PaymeErrorCode.TransactionNotFound, {
    ru: 'Транзакция не найдена',
    uz: 'Tranzaksiya topilmadi',
    en: 'Transaction not found',
  });
}

export function cantDoOperation(): PaymeException {
  return new PaymeException(PaymeErrorCode.CantDoOperation, {
    ru: 'Невозможно выполнить операцию',
    uz: 'Operatsiyani bajarib bo‘lmaydi',
    en: 'Unable to perform operation',
  });
}
