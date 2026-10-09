export interface RequestUser {
  id: string;
  deviceId: string;
  timezone: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    deviceId?: string;
    user?: RequestUser;
  }
}
