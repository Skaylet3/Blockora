'use client';

import { BlockCard } from '@/components/block-card';
import { CreateBlockDialog } from '@/components/create-block-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getAllTags } from '@/lib/mock-data';
import { getTagColor, TYPE_COLORS } from '@/lib/tag-colors';
import type { Block, BlockStatus, BlockType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LayoutGrid, Plus, Search, SlidersHorizontal } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const BLOCK_TYPES: { label: string; value: string }[] = [
	{ label: 'All Types', value: '' },
	{ label: 'Note', value: 'Note' },
	{ label: 'Task', value: 'Task' },
	{ label: 'Snippet', value: 'Snippet' },
	{ label: 'Idea', value: 'Idea' },
];

interface BlocksClientProps {
	initialBlocks: Block[];
}

export function BlocksClient({ initialBlocks }: BlocksClientProps) {
	const [blocks, setBlocks] = React.useState<Block[]>(initialBlocks);
	const [searchQuery, setSearchQuery] = React.useState('');
	const [typeFilter, setTypeFilter] = React.useState('');
	const [tagFilter, setTagFilter] = React.useState('');
	const [activeTab, setActiveTab] = React.useState<BlockStatus>('active');
	const [createOpen, setCreateOpen] = React.useState(false);
	const [selectedBlock, setSelectedBlock] = React.useState<Block | null>(null);

	const allTags = React.useMemo(() => {
		const tags = getAllTags(blocks);
		return [
			{ label: 'All Tags', value: '' },
			...tags.map(t => ({ label: t, value: t })),
		];
	}, [blocks]);

	const filteredBlocks = React.useMemo(() => {
		return blocks.filter(block => {
			if (block.status !== activeTab) return false;
			if (
				searchQuery &&
				!block.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
				!block.content.toLowerCase().includes(searchQuery.toLowerCase())
			)
				return false;
			if (typeFilter && block.type !== (typeFilter as BlockType)) return false;
			if (tagFilter && !block.tags.includes(tagFilter)) return false;
			return true;
		});
	}, [blocks, searchQuery, typeFilter, tagFilter, activeTab]);

	function handleCreateBlock(
		data: Omit<Block, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
	) {
		const newBlock: Block = {
			...data,
			id: `local-${Date.now()}`,
			status: 'active',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		setBlocks(prev => [newBlock, ...prev]);
		toast.success(`"${data.title}" created.`);
	}

	function handleArchive(id: string) {
		setBlocks(prev =>
			prev.map(b => {
				if (b.id !== id) return b;
				const next = b.status === 'active' ? 'archived' : 'active';
				toast.success(
					next === 'archived'
						? `"${b.title}" archived.`
						: `"${b.title}" restored.`,
				);
				return { ...b, status: next };
			}),
		);
		setSelectedBlock(null);
	}

	const activeCount = blocks.filter(b => b.status === 'active').length;
	const archivedCount = blocks.filter(b => b.status === 'archived').length;

	return (
		<>
			<main className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
				{/* Page header */}
				<div className='mb-6 flex items-center justify-between'>
					<h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
						Your Blocks
					</h1>
					<Button onClick={() => setCreateOpen(true)} className='gap-1.5'>
						<Plus className='h-4 w-4' />
						<span className='hidden sm:inline'>Create Block</span>
						<span className='sm:hidden'>New</span>
					</Button>
				</div>

				{/* Search + Filters */}
				<div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center'>
					<div className='relative flex-1'>
						<Search className='absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
						<Input
							placeholder='Search blocks...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className='pl-8'
						/>
					</div>
					<div className='flex gap-2'>
						<Select
							value={typeFilter}
							onChange={setTypeFilter}
							options={BLOCK_TYPES}
							className='w-full sm:w-36'
						/>
						<Select
							value={tagFilter}
							onChange={setTagFilter}
							options={allTags}
							className='w-full sm:w-36'
						/>
					</div>
				</div>

				{/* Tabs */}
				<div className='mb-6 flex items-center gap-1 rounded-lg bg-muted p-1 w-fit'>
					<TabButton
						active={activeTab === 'active'}
						onClick={() => setActiveTab('active')}
						count={activeCount}
					>
						Active
					</TabButton>
					<TabButton
						active={activeTab === 'archived'}
						onClick={() => setActiveTab('archived')}
						count={archivedCount}
					>
						Archived
					</TabButton>
				</div>

				{/* Grid */}
				{filteredBlocks.length === 0 ? (
					<EmptyState
						tab={activeTab}
						hasFilters={!!(searchQuery || typeFilter || tagFilter)}
						onClear={() => {
							setSearchQuery('');
							setTypeFilter('');
							setTagFilter('');
							toast.info('Filters cleared.');
						}}
						onCreate={() => setCreateOpen(true)}
					/>
				) : (
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{filteredBlocks.map(block => (
							<BlockCard
								key={block.id}
								block={block}
								onClick={() => setSelectedBlock(block)}
							/>
						))}
					</div>
				)}
			</main>

			<CreateBlockDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				onSubmit={handleCreateBlock}
			/>

			{/* Block detail sheet */}
			{selectedBlock && (
				<BlockDetailSheet
					block={selectedBlock}
					onClose={() => setSelectedBlock(null)}
					onArchive={() => handleArchive(selectedBlock.id)}
				/>
			)}
		</>
	);
}

function TabButton({
	active,
	onClick,
	children,
	count,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
	count: number;
}) {
	return (
		<button
			onClick={onClick}
			className={cn(
				'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-all',
				active
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground',
			)}
		>
			{children}
			<span
				className={cn(
					'rounded-full px-1.5 py-0.5 text-xs font-medium',
					active ? 'bg-muted text-muted-foreground' : 'text-muted-foreground',
				)}
			>
				{count}
			</span>
		</button>
	);
}

function EmptyState({
	tab,
	hasFilters,
	onClear,
	onCreate,
}: {
	tab: BlockStatus;
	hasFilters: boolean;
	onClear: () => void;
	onCreate: () => void;
}) {
	return (
		<div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center'>
			<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
				<LayoutGrid className='h-6 w-6 text-muted-foreground' />
			</div>
			{hasFilters ? (
				<>
					<h3 className='mb-1.5 text-sm font-medium text-foreground'>
						No blocks match your filters
					</h3>
					<p className='mb-4 text-sm text-muted-foreground'>
						Try adjusting your search or filters.
					</p>
					<Button variant='outline' size='sm' onClick={onClear}>
						<SlidersHorizontal className='mr-1.5 h-3.5 w-3.5' />
						Clear filters
					</Button>
				</>
			) : tab === 'archived' ? (
				<>
					<h3 className='mb-1.5 text-sm font-medium text-foreground'>
						No archived blocks
					</h3>
					<p className='text-sm text-muted-foreground'>
						Archived blocks will appear here.
					</p>
				</>
			) : (
				<>
					<h3 className='mb-1.5 text-sm font-medium text-foreground'>
						No blocks yet
					</h3>
					<p className='mb-4 text-sm text-muted-foreground'>
						Capture your first thought, snippet, or idea.
					</p>
					<Button size='sm' onClick={onCreate}>
						<Plus className='mr-1.5 h-3.5 w-3.5' />
						Create your first block
					</Button>
				</>
			)}
		</div>
	);
}

function BlockDetailSheet({
	block,
	onClose,
	onArchive,
}: {
	block: Block;
	onClose: () => void;
	onArchive: () => void;
}) {
	return (
		<div
			className='fixed inset-0 z-40 flex'
			onClick={e => e.target === e.currentTarget && onClose()}
		>
			<div
				className='absolute inset-0 bg-black/30 backdrop-blur-sm'
				onClick={onClose}
			/>
			<div className='relative ml-auto flex h-dvh w-full max-w-md flex-col bg-background shadow-2xl'>
				{/* Header */}
				<div className='flex items-start justify-between border-b border-border p-6'>
					<div className='flex-1 pr-4'>
						<div className='mb-2 flex flex-wrap gap-1.5'>
							<span
								className={cn(
									'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
									TYPE_COLORS[block.type],
								)}
							>
								{block.type}
							</span>
							<span className='inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize'>
								{block.status}
							</span>
						</div>
						<h2 className='text-lg font-semibold text-foreground'>
							{block.title}
						</h2>
					</div>
					<button
						onClick={onClose}
						className='rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors'
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='16'
							height='16'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
						>
							<path d='M18 6 6 18' />
							<path d='m6 6 12 12' />
						</svg>
					</button>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto p-6'>
					{block.type === 'Snippet' ? (
						<pre className='rounded-lg bg-muted p-4 text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-all font-mono'>
							{block.content}
						</pre>
					) : (
						<p className='text-sm text-foreground leading-relaxed'>
							{block.content}
						</p>
					)}

					{block.tags.length > 0 && (
						<div className='mt-6'>
							<p className='mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
								Tags
							</p>
							<div className='flex flex-wrap gap-1.5'>
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
						</div>
					)}

					<div className='mt-6 space-y-1 text-xs text-muted-foreground'>
						<p>
							Updated{' '}
							{new Date(block.updatedAt).toLocaleDateString('en-US', {
								month: 'long',
								day: 'numeric',
								year: 'numeric',
							})}
						</p>
						<p>
							Created{' '}
							{new Date(block.createdAt).toLocaleDateString('en-US', {
								month: 'long',
								day: 'numeric',
								year: 'numeric',
							})}
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className='border-t border-border p-4 flex gap-2'>
					<Button variant='outline' className='flex-1' onClick={onArchive}>
						{block.status === 'active' ? 'Archive' : 'Restore'}
					</Button>
					<Button className='flex-1' onClick={onClose}>
						Done
					</Button>
				</div>
			</div>
		</div>
	);
}
