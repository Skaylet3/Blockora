import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark a route or controller as publicly accessible (bypasses global JWT guard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
