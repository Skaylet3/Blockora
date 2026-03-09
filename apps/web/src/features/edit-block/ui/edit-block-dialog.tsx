'use client';

import type { Block, BlockType } from '@/entities/block';
import { blocksApi } from '@/shared/api/blocks.api';
import { ApiRequestError } from '@/shared/api/http-client';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	Textarea,
} from '@/shared/ui';
import * as React from 'react';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
	{ label: 'Note', value: 'NOTE' },
	{ label: 'Task', value: 'TASK' },
	{ label: 'Snippet', value: 'SNIPPET' },
	{ label: 'Idea', value: 'IDEA' },
];

interface EditBlockDialogProps {
	block: Block;
	open: boolean;
	onClose: () => void;
	onSave: (updated: Block) => void;
}

export function EditBlockDialog({
	block,
	open,
	onClose,
	onSave,
}: EditBlockDialogProps) {
	const [title, setTitle] = React.useState(block.title);
	const [content, setContent] = React.useState(block.content);
	const [type, setType] = React.useState<BlockType>(block.type);
	const [tagsInput, setTagsInput] = React.useState(block.tags.join(', '));
	const [submitting, setSubmitting] = React.useState(false);

	// Sync state when block changes (e.g., a different block is opened for editing)
	React.useEffect(() => {
		setTitle(block.title);
		setContent(block.content);
		setType(block.type);
		setTagsInput(block.tags.join(', '));
	}, [block]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) {
			toast.error('Title is required.');
			return;
		}

		const tags = Array.from(
			new Set(
				tagsInput
					.split(',')
					.map(t => t.trim().toLowerCase())
					.filter(Boolean),
			),
		);

		setSubmitting(true);
		try {
			const updated = await blocksApi.updateBlock(block.id, {
				title: title.trim(),
				content: content.trim(),
				type,
				tags,
			});
			onSave(updated);
			toast.success('Block updated.');
		} catch (err: unknown) {
			if (err instanceof ApiRequestError) {
				const msg = Array.isArray(err.messages)
					? err.messages.join(', ')
					: err.message;
				toast.error(msg);
			} else {
				toast.error('Failed to update block. Please try again.');
			}
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
			<DialogContent
				title='Edit block'
				description='Update this block'
				className='w-[95vw] sm:max-w-lg'
			>
				<DialogHeader>
					<DialogTitle>Edit block</DialogTitle>
					<DialogDescription>Make changes to your block.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-1.5'>
						<Label htmlFor='edit-title'>Title</Label>
						<Input
							id='edit-title'
							placeholder='Block title...'
							value={title}
							onChange={e => setTitle(e.target.value)}
							autoFocus
						/>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='edit-content'>Content</Label>
						<Textarea
							id='edit-content'
							placeholder='Write your content here...'
							value={content}
							onChange={e => setContent(e.target.value)}
							className='min-h-[120px]'
						/>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5'>
							<Label htmlFor='edit-type'>Type</Label>
							<Select
								value={type}
								onChange={v => setType(v as BlockType)}
								options={TYPE_OPTIONS}
							/>
						</div>

						<div className='space-y-1.5'>
							<Label htmlFor='edit-tags'>Tags</Label>
							<Input
								id='edit-tags'
								placeholder='react, ui, api...'
								value={tagsInput}
								onChange={e => setTagsInput(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={submitting}>
							{submitting ? 'Saving...' : 'Save changes'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
