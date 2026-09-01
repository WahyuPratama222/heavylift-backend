export function getRefreshTokenKey(sub: string, jti: string): string {
  return `refresh_token:${sub}:${jti}`;
}

export function getSessionsKey(sub: string): string {
  return `refresh_sessions:${sub}`;
}