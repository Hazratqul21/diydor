import { Body, Controller, Headers, HttpCode, Logger, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymeService } from './payme.service';
import { PaymeException, LocalizedMessage } from './payme.exception';
import { PaymeErrorCode } from './payme.constants';
import { PaymeRequest } from './dto/payme-request.dto';
import { Public } from '../auth/public.decorator';

@SkipThrottle() // Payme billing serveri ko'p so'rov yuboradi — rate-limit qo'llanmaydi
@Controller('payments')
export class PaymeController {
  private readonly logger = new Logger('Payme');

  constructor(private readonly payme: PaymeService) {}

  /**
   * Payme billing serveri shu endpointni chaqiradi (JSON-RPC).
   * MUHIM: har doim HTTP 200 qaytariladi; xatolar RPC error formatida.
   */
  @Public()
  @Post('payme')
  @HttpCode(200)
  async handle(@Headers('authorization') auth: string | undefined, @Body() body: PaymeRequest) {
    const id = body?.id ?? null;
    const account = (body?.params?.account ?? {}) as Record<string, unknown>;
    // Kirish so'rovini log qilamiz (kalit/maxfiy ma'lumotsiz) — sandbox debug uchun
    this.logger.log(
      `<- ${body?.method ?? '?'} order=${account.order_id ?? '-'} amount=${body?.params?.amount ?? '-'} txid=${body?.params?.id ?? '-'}`,
    );

    // 1. Avtorizatsiya
    if (!(await this.payme.checkAuth(auth))) {
      this.logger.warn(`-> AUTH RAD (-32504) method=${body?.method ?? '?'}`);
      return this.rpcError(id, PaymeErrorCode.InvalidAuth, 'Insufficient privilege to perform this method');
    }

    // 2. RPC shaklini tekshirish
    if (!body || typeof body.method !== 'string' || typeof body.params !== 'object') {
      this.logger.warn('-> Invalid Request (-32600)');
      return this.rpcError(id, PaymeErrorCode.InvalidRequest, 'Invalid Request');
    }

    // 3. Metodni bajarish
    try {
      const result = await this.payme.dispatch(body.method, body.params);
      this.logger.log(`-> OK ${body.method}`);
      return { jsonrpc: '2.0', id, result };
    } catch (e) {
      if (e instanceof PaymeException) {
        this.logger.warn(`-> RPC error ${e.code} (${body.method})`);
        return this.rpcError(id, e.code, e.rpcMessage, e.data);
      }
      // Kutilmagan xato — Payme uchun ichki xato
      this.logger.error(`-> Internal error (${body.method}): ${(e as Error).message}`);
      return this.rpcError(id, PaymeErrorCode.Internal, 'Internal server error');
    }
  }

  private rpcError(
    id: number | string | null,
    code: number,
    message: string | LocalizedMessage,
    data?: string,
  ) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message, ...(data !== undefined ? { data } : {}) },
    };
  }
}
