import { createApiClient } from './api-client';
import { config } from './config';
import { getDeviceId } from './device-id';

export const api = createApiClient({ baseUrl: config.apiUrl, getDeviceId });
