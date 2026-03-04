import { ArrowLeft, SquareDashed } from 'lucide-react';
import Link from 'next/link';

export function ProfileNavbar() {
	return (
		<header className='sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm'>
			<div className='w-full px-4'>
				<div className='flex h-14 items-center justify-between'>
					<div className='flex items-center gap-2'>
						<SquareDashed className='h-5 w-5 text-foreground' strokeWidth={2} />
						<span className='hidden sm:inline-block text-base font-semibold tracking-tight text-foreground'>
							Blockora
						</span>
					</div>
					<Link
						href='/'
						className='rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
						aria-label='Back to dashboard'
					>
						<ArrowLeft className='h-4 w-4' />
					</Link>
				</div>
			</div>
		</header>
	);
}
