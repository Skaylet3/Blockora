export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

const ACCESS_TOKEN_KEY = 'blockora-access-token';
const REFRESH_TOKEN_KEY = 'blockora-refresh-token';

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
	if (!isBrowser()) return null;
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
	if (!isBrowser()) return null;
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(pair: TokenPair): void {
	if (!isBrowser()) return;
	localStorage.setItem(ACCESS_TOKEN_KEY, pair.accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, pair.refreshToken);
}

export function clearTokens(): void {
	if (!isBrowser()) return;
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}
