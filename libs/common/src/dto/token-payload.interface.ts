export interface TokenPayload {
  _id: string;
  roleId: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  accesses: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
