'use client';

import { cn } from '@/shared/lib';
import { Navbar } from '@/widgets/navbar';
import {
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	ChevronsDown,
	ChevronsRight,
	FileText,
	Folder,
	FolderPlus,
	Network,
	Plus,
	Trash,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DraggableFABProps {
	onClick: () => void;
	show: boolean;
	className?: string;
}

function DraggableFAB({ onClick, show, className }: DraggableFABProps) {
	const [position, setPosition] = useState({ x: -100, y: -100 }); // Initial off-screen
	const [isDragging, setIsDragging] = useState(false);
	const [isMoved, setIsMoved] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dragStart = useRef({ x: 0, y: 0 });
	const initialPos = useRef({ x: 0, y: 0 });

	const snapToCorner = useCallback((x: number, y: number) => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const margin = 24;
		const buttonWidth = 56;

		const midX = vw / 2;
		const midY = vh / 2;

		let finalX = margin;
		let finalY = margin;

		if (x + buttonWidth / 2 > midX) {
			finalX = vw - buttonWidth - margin;
		}
		if (y + buttonWidth / 2 > midY) {
			finalY = vh - buttonWidth - margin;
		}

		setPosition({ x: finalX, y: finalY });
	}, []);

	const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
		setIsDragging(true);
		setIsMoved(false);
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

		dragStart.current = { x: clientX, y: clientY };

		const rect = buttonRef.current?.getBoundingClientRect();
		if (rect) {
			initialPos.current = { x: rect.left, y: rect.top };
		}
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMove = (e: MouseEvent | TouchEvent) => {
			const clientX =
				'touches' in e
					? (e as TouchEvent).touches[0].clientX
					: (e as MouseEvent).clientX;
			const clientY =
				'touches' in e
					? (e as TouchEvent).touches[0].clientY
					: (e as MouseEvent).clientY;

			const dx = clientX - dragStart.current.x;
			const dy = clientY - dragStart.current.y;

			if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
				setIsMoved(true);
			}

			setPosition({
				x: initialPos.current.x + dx,
				y: initialPos.current.y + dy,
			});
		};

		const handleUp = () => {
			setIsDragging(false);
			if (isMoved) {
				snapToCorner(position.x, position.y);
			}
		};

		window.addEventListener('mousemove', handleMove);
		window.addEventListener('mouseup', handleUp);
		window.addEventListener('touchmove', handleMove);
		window.addEventListener('touchend', handleUp);

		return () => {
			window.removeEventListener('mousemove', handleMove);
			window.removeEventListener('mouseup', handleUp);
			window.removeEventListener('touchmove', handleMove);
			window.removeEventListener('touchend', handleUp);
		};
	}, [isDragging, isMoved, position, snapToCorner]);

	useEffect(() => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const margin = 24;
		const buttonWidth = 56;

		// Use requestAnimationFrame to avoid "setState in effect" warning if synchronous
		requestAnimationFrame(() => {
			setPosition({
				x: vw - buttonWidth - margin,
				y: vh - buttonWidth - margin,
			});
		});
	}, []);

	if (!show) return null;

	return (
		<button
			ref={buttonRef}
			onClick={() => !isMoved && onClick()}
			onMouseDown={handleMouseDown}
			onTouchStart={handleMouseDown}
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				position: 'fixed',
				zIndex: 100,
				cursor: isDragging ? 'grabbing' : 'grab',
				transition: isDragging
					? 'none'
					: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
			}}
			className={cn(
				'w-14 h-14 bg-[#0A0B14] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-black hover:scale-110 active:scale-95 transition-all outline-none',
				className,
			)}
		>
			<Plus className='w-6 h-6 pointer-events-none' />
		</button>
	);
}

const generateId = () => Math.random().toString(36).substr(2, 9);

type Storage = {
	id: string;
	name: string;
	parentId: string | null;
	expanded: boolean;
};

type Note = {
	id: string;
	title: string;
	content: string;
	storageId: string;
};

const initialStorages: Storage[] = [
	{ id: '1', name: 'Storage Level 1', parentId: null, expanded: true },
	{ id: '2', name: 'Storage Level 2', parentId: '1', expanded: false },
];

const initialNotes: Note[] = [];

export function NotesPage() {
	const [storages, setStorages] = useState<Storage[]>(initialStorages);
	const [notes, setNotes] = useState<Note[]>(initialNotes);

	const [selectedStorageId, setSelectedStorageId] = useState<string | null>(
		null,
	);
	const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

	const [isCreatingNote, setIsCreatingNote] = useState(false);
	const [draftNote, setDraftNote] = useState({ title: '', content: '' });

	const [creatingStorageParentId, setCreatingStorageParentId] = useState<
		string | null | undefined
	>(undefined);
	const [newStorageName, setNewStorageName] = useState('');

	const handleAddStorage = (parentId: string | null, e?: React.MouseEvent) => {
		e?.stopPropagation();
		setCreatingStorageParentId(parentId);
		setNewStorageName('');
		if (parentId) {
			setStorages(prev =>
				prev.map(s => (s.id === parentId ? { ...s, expanded: true } : s)),
			);
		}
	};

	const confirmAddStorage = () => {
		if (!newStorageName.trim()) return;
		const parentId = creatingStorageParentId ?? null;
		const newStorage = {
			id: generateId(),
			name: newStorageName,
			parentId,
			expanded: false,
		};
		setStorages([...storages, newStorage]);
		if (parentId) {
			setStorages(prev =>
				prev.map(s => (s.id === parentId ? { ...s, expanded: true } : s)),
			);
		}
		setCreatingStorageParentId(undefined);
		setNewStorageName('');
	};

	const cancelAddStorage = () => {
		setCreatingStorageParentId(undefined);
		setNewStorageName('');
	};

	const handleDeleteStorage = (id: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		const getChildrenIds = (parentId: string): string[] => {
			const children = storages.filter(s => s.parentId === parentId);
			return [
				...children.map(c => c.id),
				...children.flatMap(c => getChildrenIds(c.id)),
			];
		};
		const idsToDelete = [id, ...getChildrenIds(id)];

		setStorages(prev => prev.filter(s => !idsToDelete.includes(s.id)));
		setNotes(prev => prev.filter(n => !idsToDelete.includes(n.storageId)));

		if (selectedStorageId && idsToDelete.includes(selectedStorageId)) {
			setSelectedStorageId(null);
			setIsCreatingNote(false);
			setSelectedNoteId(null);
		}
	};

	const toggleStorage = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setStorages(prev =>
			prev.map(s => (s.id === id ? { ...s, expanded: !s.expanded } : s)),
		);
	};

	const openStorage = (id: string) => {
		setSelectedStorageId(id);
		setSelectedNoteId(null);
		setIsCreatingNote(false);
	};

	const handleCreateNote = () => {
		if (!selectedStorageId) return;
		setIsCreatingNote(true);
		setSelectedNoteId(null);
		setDraftNote({ title: '', content: '' });
	};

	const handleOpenNote = (noteId: string) => {
		const note = notes.find(n => n.id === noteId);
		if (!note) return;
		setSelectedNoteId(noteId);
		setIsCreatingNote(false);
		setDraftNote({ title: note.title, content: note.content });
	};

	const handleSaveNote = () => {
		if (selectedNoteId) {
			setNotes(prev =>
				prev.map(n => (n.id === selectedNoteId ? { ...n, ...draftNote } : n)),
			);
		} else if (isCreatingNote && selectedStorageId) {
			const newNote = {
				id: generateId(),
				storageId: selectedStorageId,
				...draftNote,
			};
			setNotes([...notes, newNote]);
			setSelectedNoteId(newNote.id);
		}
		setIsCreatingNote(false);
	};

	const handleCancelNote = () => {
		setIsCreatingNote(false);
		if (selectedNoteId) {
			setSelectedNoteId(null);
		}
	};

	const handleDeleteNote = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setNotes(prev => prev.filter(n => n.id !== id));
		if (selectedNoteId === id) {
			setSelectedNoteId(null);
		}
	};

	const isAllExpanded = storages.every(s => s.expanded);
	const handleToggleExpandAll = () => {
		setStorages(prev => prev.map(s => ({ ...s, expanded: !isAllExpanded })));
	};

	const rightSideActive = Boolean(selectedNoteId || isCreatingNote);

	const renderStorageNodes = (
		parentId: string | null = null,
		level: number = 0,
	) => {
		const nodes = storages.filter(s => s.parentId === parentId);
		const renderedNodes = nodes.map(storage => {
			const hasChildren = storages.some(s => s.parentId === storage.id);
			const storageNotes = notes.filter(n => n.storageId === storage.id);
			const isExpandable = hasChildren || storageNotes.length > 0;
			const isSelected = selectedStorageId === storage.id;
			const noteCount = storageNotes.length;

			return (
				<div key={storage.id}>
					<div
						className='flex items-center mb-0.5'
						style={{ paddingLeft: `${level * 16 + 8}px` }}
					>
						<div
							className={cn(
								'w-4 h-4 mr-1 flex items-center justify-center cursor-pointer shrink-0 text-muted-foreground hover:text-foreground',
								!isExpandable && 'invisible',
							)}
							onClick={e => toggleStorage(storage.id, e)}
						>
							{storage.expanded ? (
								<ChevronDown className='w-3.5 h-3.5' />
							) : (
								<ChevronRight className='w-3.5 h-3.5' />
							)}
						</div>

						<div
							onClick={() => openStorage(storage.id)}
							className={cn(
								'group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer text-sm w-[240px] shrink-0',
								isSelected
									? 'bg-accent/50 text-accent-foreground font-medium'
									: 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
							)}
						>
							<div className='flex items-center gap-1.5 overflow-hidden'>
								<Folder className='w-4 h-4 shrink-0 text-muted-foreground' />
								<span className='truncate'>{storage.name}</span>
							</div>

							<div className='flex items-center gap-1 shrink-0'>
								<span
									className={cn(
										'text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground',
										isSelected && 'bg-background text-foreground',
									)}
								>
									{noteCount}
								</span>

								<div className='flex items-center'>
									<button
										onClick={e => handleAddStorage(storage.id, e)}
										className='p-1 text-muted-foreground hover:text-foreground rounded'
										title='Add sub-storage'
									>
										<FolderPlus className='w-3.5 h-3.5' />
									</button>
									<button
										onClick={e => handleDeleteStorage(storage.id, e)}
										className='p-1 text-muted-foreground hover:text-destructive rounded'
										title='Delete storage'
									>
										<Trash className='w-3.5 h-3.5' />
									</button>
								</div>
							</div>
						</div>
					</div>

					{storage.expanded && (
						<>
							{storageNotes.map(note => (
								<div
									key={note.id}
									className='flex items-center mb-0.5'
									style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
								>
									<div className='w-4 h-4 mr-1 shrink-0' />
									<div
										onClick={e => {
											e.stopPropagation();
											handleOpenNote(note.id);
										}}
										className={cn(
											'group flex items-center justify-between py-1.5 px-2 pr-3 rounded-md cursor-pointer text-sm w-[240px] shrink-0',
											selectedNoteId === note.id
												? 'bg-accent/50 text-accent-foreground font-medium'
												: 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
										)}
									>
										<div className='flex items-center gap-1.5 overflow-hidden'>
											<FileText className='w-4 h-4 shrink-0 text-muted-foreground' />
											<span className='truncate mr-4'>
												{note.title || 'Untitled Note'}
											</span>
										</div>
										<div className='flex items-center gap-1 shrink-0'>
											<button
												onClick={e => handleDeleteNote(note.id, e)}
												className='p-1 text-muted-foreground hover:text-destructive rounded'
												title='Delete note'
											>
												<Trash className='w-3.5 h-3.5' />
											</button>
										</div>
									</div>
								</div>
							))}
							{renderStorageNodes(storage.id, level + 1)}
						</>
					)}
				</div>
			);
		});

		if (creatingStorageParentId === parentId) {
			const parentName = parentId
				? storages.find(s => s.id === parentId)?.name
				: null;
			renderedNodes.push(
				<div
					key='create-form'
					className='mb-2 mt-1'
					style={{ paddingLeft: `${level * 16 + 8}px` }}
				>
					{parentName && (
						<div className='text-[10px] text-muted-foreground mb-1 ml-1'>
							Creating in: {parentName}
						</div>
					)}
					<div className='flex items-center gap-2'>
						<input
							autoFocus
							value={newStorageName}
							onChange={e => setNewStorageName(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') confirmAddStorage();
								if (e.key === 'Escape') cancelAddStorage();
							}}
							placeholder='Storage name...'
							className='flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm min-w-0 shadow-sm outline-none focus:ring-1 focus:ring-ring'
						/>
						<button
							onClick={confirmAddStorage}
							className='w-9 h-9 bg-[#0A0B14] text-white rounded-lg flex items-center justify-center shrink-0 hover:bg-black transition-colors'
						>
							<Plus className='w-4 h-4' />
						</button>
						<button
							onClick={cancelAddStorage}
							className='text-xs font-medium text-muted-foreground hover:text-foreground p-2'
						>
							Cancel
						</button>
					</div>
				</div>,
			);
		}

		return renderedNodes;
	};

	const renderMainContent = () => {
		if (isCreatingNote || selectedNoteId) {
			const activeNote = notes.find(n => n.id === selectedNoteId);
			const activeStorageId = activeNote?.storageId || selectedStorageId;
			const activeStorageName =
				storages.find(s => s.id === activeStorageId)?.name || '';

			return (
				<div className='flex flex-col h-full relative'>
					<div className='flex items-center justify-between p-4 shrink-0'>
						<div className='flex items-center'>
							<button
								className='p-1.5 -ml-1.5 text-muted-foreground hover:bg-zinc-100 rounded-md transition-colors'
								onClick={handleCancelNote}
								title='Close Note'
							>
								<ArrowLeft className='w-5 h-5' />
							</button>
							{activeStorageName && (
								<span className='ml-3 text-[14px] text-muted-foreground/70'>
									{activeStorageName}
								</span>
							)}
						</div>
						<div className='flex items-center gap-2'>
							<button
								onClick={handleCancelNote}
								className='hidden md:block px-4 py-1.5 text-sm font-medium text-[#0A0B14] hover:bg-zinc-100 rounded-md transition-colors'
							>
								Cancel
							</button>
							<button
								onClick={handleSaveNote}
								disabled={!draftNote.title.trim()}
								className='px-4 py-1.5 text-sm font-medium bg-[#0A0B14] text-white hover:bg-black rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none'
							>
								Save
							</button>
						</div>
					</div>

					<div className='flex-1 pt-0 pb-6 px-4 md:px-6 md:pb-10 overflow-y-auto w-full'>
						<textarea
							placeholder='Note title...'
							value={draftNote.title}
							onChange={e =>
								setDraftNote({ ...draftNote, title: e.target.value })
							}
							rows={1}
							className='w-full text-[24px] font-semibold mb-1 bg-transparent border-none outline-none text-black placeholder:text-[#9098A9] resize-none overflow-hidden min-h-[40px] break-all'
							style={{ height: 'auto' }}
							onInput={e => {
								e.currentTarget.style.height = 'auto';
								e.currentTarget.style.height =
									e.currentTarget.scrollHeight + 'px';
							}}
						/>
						<textarea
							placeholder='Start writing...'
							value={draftNote.content}
							onChange={e =>
								setDraftNote({ ...draftNote, content: e.target.value })
							}
							className='w-full h-[calc(100%-4rem)] text-[18px] resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground leading-relaxed'
						/>
					</div>
				</div>
			);
		}

		if (selectedStorageId) {
			const currentStorageName = storages.find(
				s => s.id === selectedStorageId,
			)?.name;
			return (
				<div className='flex flex-col h-full relative'>
					<div className='md:hidden flex items-center p-4 border-b border-border'>
						<button
							className='p-2 -ml-2 mr-2 text-muted-foreground'
							onClick={() => setSelectedStorageId(null)}
						>
							<ArrowLeft className='w-5 h-5' />
						</button>
						<span className='font-medium truncate'>{currentStorageName}</span>
					</div>
					<div className='flex-1 flex flex-col items-center justify-center text-muted-foreground'>
						<FileText className='w-16 h-16 opacity-20 mb-4' strokeWidth={1.5} />
						<p className='text-sm'>Select a note or create a new one</p>
					</div>
				</div>
			);
		}

		return (
			<div className='flex flex-col h-full items-center justify-center text-muted-foreground'>
				<Folder
					className='w-20 h-20 opacity-10 text-muted-foreground mb-4'
					strokeWidth={1}
				/>
				<p className='text-[15px]'>Select a storage to get started</p>
			</div>
		);
	};

	return (
		<section className='w-full flex h-dvh flex-col bg-background relative overflow-hidden'>
			<Navbar />
			<main className='flex-1 flex overflow-hidden'>
				<div
					className={cn(
						'w-full md:w-72 lg:w-80 border-r border-border bg-background flex-col shrink-0 relative',
						rightSideActive ? 'hidden md:flex' : 'flex',
					)}
				>
					<div className='flex items-center justify-between px-4 py-3 border-b border-border shrink-0'>
						<span className='text-[11px] font-bold tracking-wider text-muted-foreground'>
							STORAGES
						</span>
						<div className='flex items-center gap-1.5 opacity-60'>
							<button
								onClick={handleToggleExpandAll}
								className='p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground'
								title={isAllExpanded ? 'Collapse All' : 'Expand All'}
							>
								{isAllExpanded ? (
									<ChevronsDown className='w-4 h-4' />
								) : (
									<ChevronsRight className='w-4 h-4' />
								)}
							</button>
							<button className='p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground'>
								<Network className='w-4 h-4' />
							</button>
							<button
								onClick={e => handleAddStorage(null, e)}
								className='p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground'
							>
								<FolderPlus className='w-4 h-4' />
							</button>
						</div>
					</div>
					<div className='flex-1 overflow-auto p-2 flex flex-col items-center md:items-stretch'>
						<div className='min-w-max pr-2'>{renderStorageNodes(null)}</div>
					</div>
				</div>
				<div
					className={cn(
						'flex-1 bg-[#FAFAFA] md:bg-white flex flex-col min-w-0 transition-colors',
						!rightSideActive ? 'hidden md:flex' : 'flex',
					)}
				>
					{renderMainContent()}
				</div>
			</main>
			<DraggableFAB show={!!selectedStorageId} onClick={handleCreateNote} />
		</section>
	);
}
