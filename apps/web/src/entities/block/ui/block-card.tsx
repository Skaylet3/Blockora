'use client';

import { cn, getTagColor, TYPE_COLORS } from '@/shared/lib';
import { ListTodo } from 'lucide-react';
import type { Block } from '../model/types';

const TYPE_DISPLAY: Record<string, string> = {
	NOTE: 'Note',
	TASK: 'Task',
	SNIPPET: 'Snippet',
	IDEA: 'Idea',
};

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
	onPromote?: () => void;
}

export function BlockCard({ block, onClick, onPromote }: BlockCardProps) {
	const isSnippet = block.type === 'SNIPPET';

	return (
		<article
			onClick={onClick}
			className={cn(
				'group flex flex-col rounded-xl border border-border bg-card p-5',
				'hover:shadow-md hover:border-zinc-300 transition-all duration-150',
				onClick && 'cursor-pointer',
			)}
		>
			<div className='flex items-start justify-between mb-2 gap-2'>
				<h3 className='font-semibold text-foreground leading-snug group-hover:text-primary transition-colors flex-1'>
					{block.title}
				</h3>
				{block.type === 'TASK' && onPromote && (
					<button
						onClick={e => {
							e.stopPropagation();
							onPromote();
						}}
						className='p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shrink-0'
						title='Add to todo list'
					>
						<ListTodo className='w-4 h-4' />
					</button>
				)}
			</div>

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
					{TYPE_DISPLAY[block.type] ?? block.type}
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
