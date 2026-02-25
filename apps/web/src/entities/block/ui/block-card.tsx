'use client';

import { cn, getTagColor, TYPE_COLORS } from '@/shared/lib';
import type { Block } from '../model/types';

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', {
		month: 'numeric',
		day: 'numeric',
		year: 'numeric',
	});
}

interface BlockCardProps {
	block: Block;
	onClick?: () => void;
}

export function BlockCard({ block, onClick }: BlockCardProps) {
	const isSnippet = block.type === 'Snippet';

	return (
		<article
			onClick={onClick}
			className={cn(
				'group flex flex-col rounded-xl border border-border bg-card p-5',
				'hover:shadow-md hover:border-zinc-300 transition-all duration-150',
				onClick && 'cursor-pointer',
			)}
		>
			<h3 className='font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors'>
				{block.title}
			</h3>

			<p
				className={cn(
					'text-sm text-muted-foreground leading-relaxed mb-4 flex-1',
					isSnippet
						? 'font-mono text-xs bg-muted/60 rounded-md p-2.5 line-clamp-4 whitespace-pre-wrap'
						: 'line-clamp-3',
				)}
			>
				{block.content}
			</p>

			<div className='flex flex-wrap gap-1.5 mb-3'>
				<span
					className={cn(
						'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
						TYPE_COLORS[block.type],
					)}
				>
					{block.type}
				</span>
				{block.tags.map(tag => (
					<span
						key={tag}
						className={cn(
							'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
							getTagColor(tag),
						)}
					>
						{tag}
					</span>
				))}
			</div>

			<p className='text-xs text-muted-foreground'>
				Updated {formatDate(block.updatedAt)}
			</p>
		</article>
	);
}
