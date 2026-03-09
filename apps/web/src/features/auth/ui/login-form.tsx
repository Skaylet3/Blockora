'use client';

import { authApi } from '@/shared/api/auth.api';
import { ApiRequestError } from '@/shared/api/http-client';
import { setTokens } from '@/shared/lib/token-storage';
import { Button, Input, Label } from '@/shared/ui';
import { SquareDashed } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import * as React from 'react';
import { toast } from 'sonner';

export function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [captchaToken, setCaptchaToken] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const turnstileRef = React.useRef<TurnstileInstance | undefined>(undefined);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!email || !password) {
			toast.error('Please fill in all fields.');
			return;
		}
		if (!captchaToken) {
			toast.error('Please complete the CAPTCHA verification.');
			return;
		}
		setLoading(true);
		try {
			const pair = await authApi.login({ email, password, captchaToken });
			setTokens(pair);
			document.cookie = 'blockora-session=1; path=/; max-age=86400';
			toast.success('Signed in. Welcome back!');
			router.push('/');
			router.refresh();
		} catch (err: unknown) {
			if (err instanceof ApiRequestError) {
				const msg = Array.isArray(err.messages) ? err.messages.join(', ') : err.message;
				toast.error(msg);
			} else {
				toast.error('Failed to sign in. Please try again.');
			}
		} finally {
			setLoading(false);
			setCaptchaToken('');
			turnstileRef.current?.reset();
		}
	}

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<div className='w-full max-w-sm'>
				{/* Logo */}
				<div className='mb-8 flex flex-col items-center gap-2'>
					<div className='flex items-center gap-2.5'>
						<SquareDashed className='h-6 w-6 text-foreground' strokeWidth={2} />
						<span className='text-2xl font-semibold tracking-tight text-foreground'>
							Blockora
						</span>
					</div>
					<p className='text-center text-sm text-amber-600'>
						Structure your thoughts. Control your knowledge.
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-1.5'>
						<Label htmlFor='email'>Email</Label>
						<Input
							id='email'
							type='email'
							placeholder='Enter your email'
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
							autoComplete='email'
							autoFocus
						/>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='password'>Password</Label>
						<Input
							id='password'
							type='password'
							placeholder='Enter your password'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							autoComplete='current-password'
						/>
					</div>

					<Turnstile
						ref={turnstileRef}
						siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''}
						onSuccess={setCaptchaToken}
						onError={() => {
							setCaptchaToken('');
							toast.error('CAPTCHA failed to load. Please disable content blockers and retry.');
						}}
						onExpire={() => setCaptchaToken('')}
					/>

					<Button type='submit' className='w-full' disabled={loading || !captchaToken}>
						{loading ? 'Signing in...' : 'Sign in'}
					</Button>

					<p className='text-center text-xs text-muted-foreground'>
						Don&apos;t have an account?{' '}
						<Link href='/register' className='underline hover:text-foreground'>
							Sign up
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}
