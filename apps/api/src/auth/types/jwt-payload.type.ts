export interface JwtPayload {
  /** userId — JWT subject claim */
  sub: string;
  /** user email at time of token issuance */
  email: string;
  /** issued-at timestamp (set by jsonwebtoken) */
  iat?: number;
  /** expiry timestamp (set by jsonwebtoken) */
  exp?: number;
}
