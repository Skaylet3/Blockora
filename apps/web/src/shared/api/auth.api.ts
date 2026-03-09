import { request } from './http-client';

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

export interface User {
	userId: string;
	email: string;
	displayName?: string | null;
}

export interface UpdateProfileBody {
	displayName?: string;
}

export interface RegisterBody {
	email: string;
	password: string;
	displayName?: string;
	captchaToken: string;
}

export interface LoginBody {
	email: string;
	password: string;
	captchaToken: string;
}

export interface RefreshBody {
	refreshToken: string;
	captchaToken: string;
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

	updateProfile(body: UpdateProfileBody): Promise<User> {
		return request<User>('/users/me', { method: 'PATCH', body });
	},
};
