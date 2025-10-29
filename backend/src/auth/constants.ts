export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development-only',
  expiresIn: (process.env.JWT_EXPIRATION || '24h') as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development-only',
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as string,
};
