export interface TokenPayload {
  sub: string;
  sessionId: string;
  phone: string;
  username: string;
  tokenType: 'access';
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}
