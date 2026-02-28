import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/shared/lib/token-storage';

export interface ApiError {
	statusCode: number;
	message: string | string[];
	error: string;
}

export class ApiRequestError extends Error {
	statusCode: number;
	messages: string[];
	errorType: string;

	constructor(apiError: ApiError) {
		const messages = Array.isArray(apiError.message)
			? apiError.message
			: [apiError.message];
		super(messages[0]);
		this.statusCode = apiError.statusCode;
		this.messages = messages;
		this.errorType = apiError.error;
	}
}

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: unknown;
	skipAuth?: boolean;
}

function getBaseUrl(): string {
	return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://blockora-api.vercel.app/api';
}

let isRefreshing = false;

async function doRefresh(): Promise<boolean> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return false;
	try {
		const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		});
		if (!res.ok) return false;
		const pair = await res.json() as { accessToken: string; refreshToken: string };
		setTokens(pair);
		return true;
	} catch {
		return false;
	}
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', body, skipAuth = false } = options;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (!skipAuth) {
		const token = getAccessToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	}

	const fetchOptions: RequestInit = {
		method,
		headers,
	};

	if (body !== undefined) {
		fetchOptions.body = JSON.stringify(body);
	}

	const url = `${getBaseUrl()}${path}`;
	let res = await fetch(url, fetchOptions);

	// On 401, attempt a token refresh once and retry
	if (res.status === 401 && !skipAuth && !isRefreshing) {
		isRefreshing = true;
		const refreshed = await doRefresh();
		isRefreshing = false;

		if (refreshed) {
			// Retry with the new access token
			const newToken = getAccessToken();
			if (newToken) {
				headers['Authorization'] = `Bearer ${newToken}`;
			}
			res = await fetch(url, { ...fetchOptions, headers });
		} else {
			// Refresh failed — clear tokens and redirect to login
			clearTokens();
			document.cookie = 'blockora-session=; path=/; max-age=0';
			window.location.href = '/login';
			throw new ApiRequestError({ statusCode: 401, message: 'Session expired', error: 'Unauthorized' });
		}
	}

	if (!res.ok) {
		let errorBody: ApiError;
		try {
			errorBody = await res.json() as ApiError;
		} catch {
			errorBody = { statusCode: res.status, message: res.statusText, error: 'Error' };
		}
		throw new ApiRequestError(errorBody);
	}

	// 204 No Content
	if (res.status === 204) {
		return undefined as T;
	}

	return res.json() as Promise<T>;
}
