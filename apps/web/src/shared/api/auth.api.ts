import { request } from './http-client';

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

export interface User {
	userId: string;
	email: string;
}

export interface RegisterBody {
	email: string;
	password: string;
	displayName?: string;
}

export interface LoginBody {
	email: string;
	password: string;
}

export interface RefreshBody {
	refreshToken: string;
}

export const authApi = {
	register(body: RegisterBody): Promise<TokenPair> {
		return request<TokenPair>('/auth/register', { method: 'POST', body, skipAuth: true });
	},

	login(body: LoginBody): Promise<TokenPair> {
		return request<TokenPair>('/auth/login', { method: 'POST', body, skipAuth: true });
	},

	refresh(body: RefreshBody): Promise<TokenPair> {
		return request<TokenPair>('/auth/refresh', { method: 'POST', body, skipAuth: true });
	},

	logout(): Promise<void> {
		return request<void>('/auth/logout', { method: 'POST' });
	},

	getMe(): Promise<User> {
		return request<User>('/auth/me');
	},
};
