'use client';

import { authApi } from '@/shared/api/auth.api';
import { ApiRequestError } from '@/shared/api/http-client';
import { setTokens } from '@/shared/lib/token-storage';
import { Button, Input, Label } from '@/shared/ui';
import { SquareDashed } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export function RegisterForm() {
	const router = useRouter();
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [displayName, setDisplayName] = React.useState('');
	const [loading, setLoading] = React.useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!email || !password) {
			toast.error('Please fill in all required fields.');
			return;
		}
		if (password.length < 8) {
			toast.error('Password must be at least 8 characters.');
			return;
		}
		setLoading(true);
		try {
			const pair = await authApi.register({
				email,
				password,
				displayName: displayName.trim() || undefined,
			});
			setTokens(pair);
			document.cookie = 'blockora-session=1; path=/; max-age=86400';
			toast.success('Account created. Welcome!');
			router.push('/');
			router.refresh();
		} catch (err: unknown) {
			if (err instanceof ApiRequestError) {
				if (err.statusCode === 409) {
					toast.error('An account with this email already exists.');
				} else {
					const msg = Array.isArray(err.messages) ? err.messages.join(', ') : err.message;
					toast.error(msg);
				}
			} else {
				toast.error('Failed to create account. Please try again.');
			}
		} finally {
			setLoading(false);
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
							placeholder='Min. 8 characters'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							autoComplete='new-password'
						/>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='displayName'>
							Display Name{' '}
							<span className='text-muted-foreground'>(optional)</span>
						</Label>
						<Input
							id='displayName'
							type='text'
							placeholder='Your name'
							value={displayName}
							onChange={e => setDisplayName(e.target.value)}
							autoComplete='name'
						/>
					</div>

					<Button type='submit' className='w-full' disabled={loading}>
						{loading ? 'Creating account...' : 'Create account'}
					</Button>

					<p className='text-center text-xs text-muted-foreground'>
						Already have an account?{' '}
						<Link href='/login' className='underline hover:text-foreground'>
							Sign in
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}
