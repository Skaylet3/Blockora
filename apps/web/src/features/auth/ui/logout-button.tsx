'use client';

import { authApi } from '@/shared/api/auth.api';
import { clearTokens } from '@/shared/lib/token-storage';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LogoutButton() {
	const router = useRouter();

	function handleLogout() {
		// Fire-and-forget: revoke server-side token; don't block the UX
		void authApi.logout().catch(() => undefined);
		clearTokens();
		document.cookie = 'blockora-session=; path=/; max-age=0';
		toast.success('Signed out successfully.');
		router.push('/login');
		router.refresh();
	}

	return (
		<button
			onClick={handleLogout}
			className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
			aria-label='Sign out'
		>
			<LogOut className='h-4 w-4' />
		</button>
	);
}
