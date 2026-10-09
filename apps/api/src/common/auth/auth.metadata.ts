import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'auth:isPublic';
export const ALLOW_UNREGISTERED = 'auth:allowUnregistered';

/** No device header required (health checks). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Device header required, but the device may not have a profile yet (onboarding). */
export const AllowUnregistered = () => SetMetadata(ALLOW_UNREGISTERED, true);
