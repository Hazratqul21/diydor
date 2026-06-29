import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** JWT guard'dan ozod qilingan (ochiq) endpoint'larni belgilaydi. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
