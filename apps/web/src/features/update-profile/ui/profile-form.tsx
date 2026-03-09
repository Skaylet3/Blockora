'use client';

import { authApi } from '@/shared/api/auth.api';
import type { ApiRequestError } from '@/shared/api/http-client';
import { Button, Input, Label } from '@/shared/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

interface ProfileFormProps {
	initialEmail: string;
	initialUserId: string;
	initialDisplayName: string;
}

export function ProfileForm({
	initialEmail,
	initialUserId,
	initialDisplayName,
}: ProfileFormProps) {
	const [email, setEmail] = React.useState(initialEmail);
	const [userId, setUserId] = React.useState(initialUserId);
	const [displayName, setDisplayName] = React.useState(initialDisplayName);
	const [savedDisplayName, setSavedDisplayName] =
		React.useState(initialDisplayName);
	const [loading, setLoading] = React.useState(!initialEmail);
	const [saving, setSaving] = React.useState(false);

	React.useEffect(() => {
		// If the server couldn't populate props (token is in localStorage, not available SSR),
		// fetch /auth/me client-side after hydration.
		if (!initialEmail) {
			authApi
				.getMe()
				.then(user => {
					setEmail(user.email);
					setUserId(user.userId);
					const name = user.displayName ?? '';
					setDisplayName(name);
					setSavedDisplayName(name);
				})
				.catch(() => {
					// silently fail; empty fields shown
				})
				.finally(() => setLoading(false));
		} else {
			setLoading(false);
		}
	}, [initialEmail]);

	async function handleSave(e: React.FormEvent) {
		e.preventDefault();
		const prevName = savedDisplayName;
		const optimisticName = displayName.trim();
		setSavedDisplayName(optimisticName);
		setSaving(true);

		try {
			const updated = await authApi.updateProfile({
				displayName: optimisticName || undefined,
			});
			const name = updated.displayName ?? '';
			setDisplayName(name);
			setSavedDisplayName(name);
			toast.success('Profile saved.');
		} catch (err) {
			setSavedDisplayName(prevName);
			setDisplayName(prevName);
			const apiErr = err as ApiRequestError;
			toast.error(apiErr?.messages?.[0] ?? 'Failed to save profile.');
		} finally {
			setSaving(false);
		}
	}

	function handleCancel() {
		setDisplayName(savedDisplayName);
		toast.info('Changes discarded.');
	}

	return (
		<div className='min-h-screen bg-zinc-50 px-4 py-10'>
			<div className='mx-auto max-w-lg'>
				<div className='rounded-xl border border-border bg-card p-6 shadow-sm'>
					{/* Profile Settings */}
					<div className='mb-5 flex items-center gap-3'>
						<Link
							href='/'
							className='hover:bg-accent hover:text-foreground text-muted-foreground transition-colors rounded-md p-1 -ml-1 flex items-center justify-center'
							aria-label='Back to dashboard'
						>
							<ArrowLeft className='h-5 w-5' />
						</Link>
						<h1 className='text-xl font-semibold text-foreground m-0 leading-none'>
							Profile Settings
						</h1>
					</div>

					<form onSubmit={handleSave} className='space-y-4'>
						<div className='space-y-1.5'>
							<Label htmlFor='displayName'>Name</Label>
							<Input
								id='displayName'
								type='text'
								value={loading ? '' : displayName}
								onChange={e => setDisplayName(e.target.value)}
								placeholder={loading ? 'Loading...' : 'Your name'}
								disabled={loading || saving}
							/>
						</div>

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
							<Button type='submit' disabled={loading || saving}>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
							<Button
								type='button'
								variant='outline'
								onClick={handleCancel}
								disabled={saving}
							>
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
								{loading ? '...' : userId || '—'}
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
