interface TurnstileGlobal {
	execute(siteKey: string, options?: { action?: string }): Promise<string>;
}

interface Window {
	turnstile?: TurnstileGlobal;
}
