// Payme JSON-RPC so'rov shakli (validatsiyani biz qo'lda qilamiz —
// noto'g'ri shaklda -32600 qaytarish kerak, 400 emas)

export interface PaymeAccount {
  order_id?: string;
  [key: string]: string | undefined;
}

export interface PaymeParams {
  id?: string;
  time?: number;
  amount?: number;
  account?: PaymeAccount;
  reason?: number;
  from?: number;
  to?: number;
}

export interface PaymeRequest {
  jsonrpc?: string;
  id?: number | string;
  method?: string;
  params?: PaymeParams;
}
