'use client';

import { authApi } from '@/shared/api/auth.api';
import { Button, Input, Label } from '@/shared/ui';
import * as React from 'react';
import { toast } from 'sonner';

interface ProfileFormProps {
	initialEmail: string;
	initialUserId: string;
}

export function ProfileForm({ initialEmail, initialUserId }: ProfileFormProps) {
	const [email, setEmail] = React.useState(initialEmail);
	const [userId, setUserId] = React.useState(initialUserId);
	const [loading, setLoading] = React.useState(!initialEmail);

	React.useEffect(() => {
		// If the server couldn't populate props (token is in localStorage, not available SSR),
		// fetch /auth/me client-side after hydration.
		if (!initialEmail) {
			authApi
				.getMe()
				.then(user => {
					setEmail(user.email);
					setUserId(user.userId);
				})
				.catch(() => {
					// silently fail; empty fields shown
				})
				.finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, [initialEmail]);

	function handleSave(e: React.FormEvent) {
		e.preventDefault();
		toast.info('Profile editing coming soon.');
	}

	function handleCancel() {
		toast.info('Changes discarded.');
	}

	return (
		<div className='min-h-screen bg-zinc-50 px-4 py-10'>
			<div className='mx-auto max-w-lg'>
				<div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
					{/* Profile Settings */}
					<h1 className='mb-5 text-xl font-semibold text-foreground'>
						Profile Settings
					</h1>

					<form onSubmit={handleSave} className='space-y-4'>
						<div className='space-y-1.5'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								value={loading ? '' : email}
								disabled
								placeholder={loading ? 'Loading...' : 'Your email'}
							/>
						</div>

						<div className='flex gap-2 pt-1'>
							<Button type='submit'>Save Changes</Button>
							<Button type='button' variant='outline' onClick={handleCancel}>
								Cancel
							</Button>
						</div>
					</form>

					{/* Divider */}
					<div className='my-6 border-t border-border' />

					{/* Account Information */}
					<h2 className='mb-4 text-base font-semibold text-foreground'>
						Account Information
					</h2>

					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>User ID</span>
							<span className='text-sm font-medium text-amber-600'>
								{loading ? '...' : (userId || '—')}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								Account Type
							</span>
							<span className='text-sm font-medium text-amber-600'>
								Standard
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-muted-foreground'>
								Member since
							</span>
							<span className='text-sm font-medium text-amber-600'>
								Feb 2026
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
