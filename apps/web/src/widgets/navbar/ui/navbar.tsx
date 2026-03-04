import { LogoutButton } from '@/features/auth';
import { SquareDashed, User } from 'lucide-react';
import Link from 'next/link';
import { NavDropdown } from './nav-dropdown';

export function Navbar() {
	return (
		<header className='sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm'>
			<div className='w-full px-4'>
				<div className='flex h-14 items-center justify-between'>
					<Link
						href='/'
						className='flex items-center gap-2 hover:opacity-80 transition-opacity'
					>
						<SquareDashed className='h-5 w-5 text-foreground' strokeWidth={2} />
						<span className='hidden sm:inline-block text-base font-semibold tracking-tight text-foreground'>
							Blockora
						</span>
					</Link>

					<div className='flex items-center gap-3'>
						<NavDropdown />
						<Link
							href='/profile'
							className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
							aria-label='Profile'
						>
							<User className='h-4 w-4' />
						</Link>
						<LogoutButton />
					</div>
				</div>
			</div>
		</header>
	);
}
