'use client';

import type { Block, BlockType } from '@/entities/block';
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

const TYPE_OPTIONS = [
	{ label: 'Note', value: 'NOTE' },
	{ label: 'Task', value: 'TASK' },
	{ label: 'Snippet', value: 'SNIPPET' },
	{ label: 'Idea', value: 'IDEA' },
];

interface CreateBlockDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (
		block: Omit<
			Block,
			'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId' | 'archivedAt'
		>,
	) => Promise<void> | void;
}

export function CreateBlockDialog({
	open,
	onClose,
	onSubmit,
}: CreateBlockDialogProps) {
	const [title, setTitle] = React.useState('');
	const [content, setContent] = React.useState('');
	const [type, setType] = React.useState<BlockType>('NOTE');
	const [tagsInput, setTagsInput] = React.useState('');
	const [errors, setErrors] = React.useState<{
		title?: string;
		content?: string;
	}>({});
	const [submitting, setSubmitting] = React.useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const newErrors: { title?: string; content?: string } = {};
		if (!title.trim()) newErrors.title = 'Title is required.';
		if (!content.trim()) newErrors.content = 'Content is required.';
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
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
			await onSubmit({
				title: title.trim(),
				content: content.trim(),
				type,
				tags,
				visibility: 'PRIVATE',
			});
			handleClose();
		} catch {
			// error already toasted in parent; keep dialog open
		} finally {
			setSubmitting(false);
		}
	}

	function handleClose() {
		setTitle('');
		setContent('');
		setType('NOTE');
		setTagsInput('');
		setErrors({});
		onClose();
	}

	return (
		<Dialog open={open} onOpenChange={open => !open && handleClose()}>
			<DialogContent
				title='Create new block'
				description='Add a new block to your collection'
				className='w-[95vw] sm:max-w-lg'
			>
				<DialogHeader>
					<DialogTitle>Create new block</DialogTitle>
					<DialogDescription>
						Capture your thought, idea, or snippet.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-1.5'>
						<Label htmlFor='title'>Title</Label>
						<Input
							id='title'
							placeholder='Block title...'
							value={title}
							onChange={e => {
								setTitle(e.target.value);
								if (errors.title) setErrors(p => ({ ...p, title: undefined }));
							}}
							autoFocus
						/>
						{errors.title && (
							<p className='text-xs text-destructive'>{errors.title}</p>
						)}
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='content'>Content</Label>
						<Textarea
							id='content'
							placeholder='Write your content here...'
							value={content}
							onChange={e => {
								setContent(e.target.value);
								if (errors.content)
									setErrors(p => ({ ...p, content: undefined }));
							}}
							className='min-h-[120px]'
						/>
						{errors.content && (
							<p className='text-xs text-destructive'>{errors.content}</p>
						)}
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5'>
							<Label htmlFor='type'>Type</Label>
							<Select
								value={type}
								onChange={v => setType(v as BlockType)}
								options={TYPE_OPTIONS}
							/>
						</div>

						<div className='space-y-1.5'>
							<Label htmlFor='tags'>Tags</Label>
							<Input
								id='tags'
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
							onClick={handleClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={submitting}>
							{submitting ? 'Creating...' : 'Create Block'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
