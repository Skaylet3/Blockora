'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
	Check,
	ChevronDown,
	FileText,
	ListTodo,
	SquareDashed,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavDropdown() {
	const pathname = usePathname();

	const currentItem =
		pathname === '/notes'
			? { label: 'Notes', icon: FileText }
			: pathname === '/todo'
				? { label: 'Todo', icon: ListTodo }
				: { label: 'Blocks', icon: SquareDashed };

	const Icon = currentItem.icon;

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger className='flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring'>
				<Icon className='h-4 w-4 opacity-70' />
				<span className='hidden sm:inline-block'>{currentItem.label}</span>
				<ChevronDown className='h-4 w-4 opacity-50' />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					align='end'
					sideOffset={8}
					className='z-50 w-48 rounded-md border border-border bg-background p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
				>
					<DropdownMenu.Item asChild>
						<Link
							href='/'
							className='relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
						>
							<SquareDashed className='mr-2 h-4 w-4 opacity-70' />
							Blocks
							{pathname === '/' && (
								<Check className='ml-auto h-4 w-4 opacity-70' />
							)}
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<Link
							href='/notes'
							className='relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
						>
							<FileText className='mr-2 h-4 w-4 opacity-70' />
							Notes
							{pathname === '/notes' && (
								<Check className='ml-auto h-4 w-4 opacity-70' />
							)}
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<Link
							href='/todo'
							className='relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
						>
							<ListTodo className='mr-2 h-4 w-4 opacity-70' />
							Todo
							{pathname === '/todo' && (
								<Check className='ml-auto h-4 w-4 opacity-70' />
							)}
						</Link>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
