'use client';

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
} from '@/shared/ui';
import * as React from 'react';
import { toast } from 'sonner';

interface DeleteBlockButtonProps {
	blockId: string;
	blockTitle: string;
	onDeleted: () => void;
}

export function DeleteBlockButton({ blockId, blockTitle, onDeleted }: DeleteBlockButtonProps) {
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);

	async function handleConfirm() {
		setDeleting(true);
		try {
			await blocksApi.deleteBlock(blockId);
			onDeleted();
			toast.success(`"${blockTitle}" deleted.`);
		} catch (err: unknown) {
			if (err instanceof ApiRequestError) {
				const msg = Array.isArray(err.messages) ? err.messages.join(', ') : err.message;
				toast.error(msg);
			} else {
				toast.error('Failed to delete block. Please try again.');
			}
		} finally {
			setDeleting(false);
			setConfirmOpen(false);
		}
	}

	return (
		<>
			<Button
				variant='destructive'
				className='flex-1'
				onClick={() => setConfirmOpen(true)}
			>
				Delete
			</Button>

			<Dialog open={confirmOpen} onOpenChange={isOpen => !isOpen && setConfirmOpen(false)}>
				<DialogContent
					title='Delete block'
					description='Confirm deletion'
					className='w-[95vw] sm:max-w-sm'
				>
					<DialogHeader>
						<DialogTitle>Delete block</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &ldquo;{blockTitle}&rdquo;? This
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setConfirmOpen(false)}
							disabled={deleting}
						>
							Cancel
						</Button>
						<Button
							type='button'
							variant='destructive'
							onClick={handleConfirm}
							disabled={deleting}
						>
							{deleting ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
