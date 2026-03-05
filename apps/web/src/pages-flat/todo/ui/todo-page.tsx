'use client';

import {
	PRIORITY_TO_UI,
	TodoPriority,
	TodoResponse,
	todosApi,
	TodoStatus,
} from '@/shared/api/todos.api';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Navbar } from '@/widgets/navbar';
import { Check, Edit2, Flag, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type FilterType = 'All' | 'Active' | 'Completed';

interface DraggableFABProps {
	onClick: () => void;
	show: boolean;
	className?: string;
}

function DraggableFAB({ onClick, show, className }: DraggableFABProps) {
	const [position, setPosition] = useState({ x: -100, y: -100 });
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
			if (isDragging && 'touches' in e) {
				// Prevent page scroll only when dragging the button
				e.preventDefault();
			}

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
		window.addEventListener('touchmove', handleMove, { passive: false });
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
				touchAction: 'none', // Crucial for mobile dragging
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

function priorityUiValue(priority: TodoPriority): 1 | 2 | 3 | 4 | 5 {
	return PRIORITY_TO_UI[priority];
}

export function TodoPage() {
	const [todos, setTodos] = useState<TodoResponse[]>([]);
	const [filter, setFilter] = useState<FilterType>('All');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
	const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);

	const [editTitle, setEditTitle] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [isModalEditing, setIsModalEditing] = useState(false);
	const [modalFocusField, setModalFocusField] = useState<
		'title' | 'description' | null
	>(null);

	// Create dialog state
	const [createOpen, setCreateOpen] = useState(false);
	const [createTitle, setCreateTitle] = useState('');
	const [createDescription, setCreateDescription] = useState('');
	const [createPriority, setCreatePriority] = useState<TodoPriority>('LOWEST');
	const [isSaving, setIsSaving] = useState(false);

	const modalTitleRef = useRef<HTMLTextAreaElement>(null);
	const modalDescRef = useRef<HTMLTextAreaElement>(null);

	const filterToStatus = (f: FilterType): TodoStatus | undefined => {
		if (f === 'Active') return 'ACTIVE';
		if (f === 'Completed') return 'COMPLETED';
		return undefined;
	};

	const loadTodos = useCallback(async (f: FilterType) => {
		setLoading(true);
		setError(null);
		try {
			const data = await todosApi.getTodos(filterToStatus(f));
			setTodos(data);
		} catch {
			setError('Failed to load todos');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTodos(filter);
	}, [filter, loadTodos]);

	const toggleTodo = async (id: string) => {
		const todo = todos.find(t => t.id === id);
		if (!todo) return;
		const newStatus: TodoStatus =
			todo.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';

		// Optimistic update
		setTodos(prev =>
			prev.map(t => (t.id === id ? { ...t, status: newStatus } : t)),
		);

		try {
			await todosApi.updateTodo(id, { status: newStatus });
			toast.success('Todo updated');
		} catch {
			// Revert
			setTodos(prev =>
				prev.map(t => (t.id === id ? { ...t, status: todo.status } : t)),
			);
			toast.error('Failed to update todo');
		}
	};

	const deleteTodo = async (id: string) => {
		try {
			await todosApi.deleteTodo(id);
			setTodos(prev => prev.filter(t => t.id !== id));
			if (selectedTodoId === id) setSelectedTodoId(null);
			toast.success('Todo deleted');
		} catch {
			toast.error('Failed to delete todo');
		}
	};

	const startEditing = (todo: TodoResponse) => {
		setEditingTodoId(todo.id);
		setEditTitle(todo.title);
		setEditDescription(todo.description ?? '');
	};

	const saveEdit = useCallback(async () => {
		const idToSave = isModalEditing ? selectedTodoId : editingTodoId;
		if (!idToSave) return;

		try {
			const updated = await todosApi.updateTodo(idToSave, {
				title: editTitle,
				description: editDescription || undefined,
			});
			setTodos(prev => prev.map(t => (t.id === idToSave ? updated : t)));
			setEditingTodoId(null);
			setIsModalEditing(false);
			toast.success('Todo saved');
		} catch {
			toast.error('Failed to save todo');
		}
	}, [
		isModalEditing,
		selectedTodoId,
		editingTodoId,
		editTitle,
		editDescription,
	]);

	const changePriority = async (id: string, priority: TodoPriority) => {
		const todo = todos.find(t => t.id === id);
		if (!todo) return;

		// Optimistic update
		setTodos(prev => prev.map(t => (t.id === id ? { ...t, priority } : t)));

		try {
			await todosApi.updateTodo(id, { priority });
		} catch {
			// Revert
			setTodos(prev =>
				prev.map(t => (t.id === id ? { ...t, priority: todo.priority } : t)),
			);
			toast.error('Failed to update priority');
		}
	};

	const handleCreate = async () => {
		if (!createTitle.trim()) return;
		setIsSaving(true);
		try {
			const newTodo = await todosApi.createTodo({
				title: createTitle.trim(),
				description: createDescription.trim() || undefined,
				priority: createPriority,
			});
			setTodos(prev => [newTodo, ...prev]);
			setCreateTitle('');
			setCreateDescription('');
			setCreatePriority('LOWEST');
			setCreateOpen(false);
			toast.success('Todo created');
		} catch {
			toast.error('Failed to create todo');
		} finally {
			setIsSaving(false);
		}
	};

	const enterModalEdit = (
		todo: TodoResponse,
		field: 'title' | 'description',
	) => {
		setEditTitle(todo.title);
		setEditDescription(todo.description ?? '');
		setIsModalEditing(true);
		setModalFocusField(field);
	};

	useEffect(() => {
		if (isModalEditing) {
			if (modalFocusField === 'title' && modalTitleRef.current) {
				const len = modalTitleRef.current.value.length;
				modalTitleRef.current.focus();
				modalTitleRef.current.setSelectionRange(len, len);
			} else if (modalFocusField === 'description' && modalDescRef.current) {
				const len = modalDescRef.current.value.length;
				modalDescRef.current.focus();
				modalDescRef.current.setSelectionRange(len, len);
			}
		}
	}, [isModalEditing, modalFocusField]);

	const selectedTodo = todos.find(t => t.id === selectedTodoId);

	return (
		<section className='flex min-h-screen flex-col bg-white'>
			<Navbar />
			<main className='mx-auto max-w-3xl px-4 sm:px-6 py-12 w-full flex-1 relative'>
				<h1 className='text-2xl font-bold tracking-tight mb-6 text-zinc-900'>
					Todo List
				</h1>

				{/* Filter Tabs */}
				<div className='flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none'>
					{(['All', 'Active', 'Completed'] as FilterType[]).map(f => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={cn(
								'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap border',
								filter === f
									? 'bg-[#0A0B14] text-white border-[#0A0B14] shadow-sm'
									: 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50',
							)}
						>
							{f}
						</button>
					))}
				</div>

				{/* Loading skeleton */}
				{loading && (
					<div className='space-y-3'>
						{[1, 2, 3].map(i => (
							<div
								key={i}
								className='p-4 rounded-xl border border-zinc-100 animate-pulse'
							>
								<div className='flex items-start gap-4'>
									<div className='mt-1 w-5 h-5 rounded bg-zinc-100' />
									<div className='flex-1 space-y-2'>
										<div className='h-4 bg-zinc-100 rounded w-3/4' />
										<div className='h-3 bg-zinc-100 rounded w-1/2' />
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Error state */}
				{!loading && error && (
					<div className='py-20 text-center border border-dashed rounded-xl border-red-200 bg-red-50/50'>
						<p className='text-red-500 font-semibold text-sm'>{error}</p>
						<Button
							variant='outline'
							size='sm'
							className='mt-4'
							onClick={() => loadTodos(filter)}
						>
							Retry
						</Button>
					</div>
				)}

				{/* Todo List */}
				{!loading && !error && (
					<div className='space-y-3'>
						{todos.map(todo => {
							const isEditing = editingTodoId === todo.id;
							const uiPriority = priorityUiValue(todo.priority);
							const isCompleted = todo.status === 'COMPLETED';

							if (isEditing) {
								return (
									<div
										key={todo.id}
										className={cn(
											'p-4 rounded-xl border transition-all shadow-lg animate-in fade-in zoom-in-95 duration-200',
											uiPriority === 1 && 'border-red-300 bg-red-50/40',
											uiPriority === 2 && 'border-orange-300 bg-orange-50/40',
											uiPriority === 3 && 'border-yellow-300 bg-yellow-50/40',
											uiPriority === 4 && 'border-blue-300 bg-blue-50/40',
											uiPriority === 5 && 'border-zinc-300 bg-zinc-50/40',
										)}
									>
										<div className='flex items-start gap-4'>
											<div className='pt-1'>
												<div className='w-5 h-5 rounded border border-zinc-300 bg-white' />
											</div>
											<div className='flex-1 min-w-0'>
												<Input
													value={editTitle}
													onChange={e => setEditTitle(e.target.value)}
													className='font-semibold text-sm text-zinc-900 h-5 p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent shadow-none'
													placeholder='Task title'
												/>
												<Textarea
													value={editDescription}
													onChange={e => setEditDescription(e.target.value)}
													className='text-[11px] text-zinc-600 mt-0.5 border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none resize-none p-0 bg-transparent shadow-none min-h-3.75'
													placeholder='Add a description...'
												/>
												<div className='flex justify-end gap-2 mt-2'>
													<Button
														variant='ghost'
														size='sm'
														className='text-zinc-500 font-semibold h-7 px-3 text-[11px]'
														onClick={() => setEditingTodoId(null)}
													>
														Cancel
													</Button>
													<Button
														size='sm'
														className='bg-[#0A0B14] hover:bg-black text-white px-4 font-semibold h-7 rounded-lg text-[11px]'
														onClick={saveEdit}
													>
														Save
													</Button>
												</div>
											</div>
										</div>
									</div>
								);
							}

							return (
								<div
									key={todo.id}
									onClick={() => setSelectedTodoId(todo.id)}
									className={cn(
										'group p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md relative overflow-hidden',
										uiPriority === 1 &&
											'border-red-200 bg-red-50/40 hover:border-red-300',
										uiPriority === 2 &&
											'border-orange-200 bg-orange-50/40 hover:border-orange-300',
										uiPriority === 3 &&
											'border-yellow-200 bg-yellow-50/40 hover:border-yellow-300',
										uiPriority === 4 &&
											'border-blue-200 bg-blue-50/40 hover:border-blue-300',
										uiPriority === 5 &&
											'border-zinc-200 bg-zinc-50/40 hover:border-zinc-300',
										isCompleted && 'opacity-80',
									)}
								>
									<div className='flex items-start gap-4'>
										<button
											onClick={e => {
												e.stopPropagation();
												toggleTodo(todo.id);
											}}
											className={cn(
												'mt-1 w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 border',
												isCompleted
													? 'bg-emerald-600 border-emerald-600 text-white'
													: 'border-zinc-300 bg-white hover:border-zinc-400',
											)}
										>
											{isCompleted && (
												<Check className='w-3 h-3' strokeWidth={4} />
											)}
										</button>

										<div className='flex-1 min-w-0'>
											<h3
												className={cn(
													'font-semibold text-sm transition-all truncate text-zinc-900',
													isCompleted &&
														'text-zinc-400 line-through decoration-zinc-300',
												)}
											>
												{todo.title}
											</h3>
											<p
												className={cn(
													'text-[11px] text-zinc-500 mt-0.5 transition-all truncate max-w-[90%]',
													isCompleted && 'text-zinc-300',
												)}
											>
												{todo.description}
											</p>
										</div>

										<div className='hidden sm:flex items-center gap-1 transition-all shrink-0 ml-4 opacity-0 group-hover:opacity-100'>
											<div
												className='p-1.5 text-zinc-300 hover:text-zinc-500 transition-colors'
												title='Priority'
											>
												<Flag
													className={cn(
														'w-4 h-4 transition-all',
														uiPriority === 1 && 'text-red-400 fill-red-400/20',
														uiPriority === 2 &&
															'text-orange-400 fill-orange-400/20',
														uiPriority === 3 &&
															'text-yellow-400 fill-yellow-400/20',
														uiPriority === 4 &&
															'text-blue-400 fill-blue-400/20',
														uiPriority === 5 &&
															'text-zinc-400 fill-zinc-400/20',
													)}
												/>
											</div>
											<button
												onClick={e => {
													e.stopPropagation();
													startEditing(todo);
												}}
												className='p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all'
												title='Edit'
											>
												<Edit2 className='w-4 h-4' />
											</button>
											<button
												onClick={e => {
													e.stopPropagation();
													deleteTodo(todo.id);
												}}
												className='p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all'
												title='Delete'
											>
												<Trash2 className='w-4 h-4' />
											</button>
										</div>
									</div>
								</div>
							);
						})}

						{todos.length === 0 && (
							<div className='py-20 text-center border border-dashed rounded-xl border-zinc-200 bg-zinc-50/50'>
								<div className='mb-3 flex justify-center'>
									<div className='w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center'>
										<Check className='w-6 h-6 text-zinc-300' />
									</div>
								</div>
								<p className='text-zinc-400 font-semibold text-sm'>
									All caught up!
								</p>
								<p className='text-zinc-400 text-[11px] mt-0.5'>
									No tasks matching this filter.
								</p>
							</div>
						)}
					</div>
				)}
			</main>

			{/* Floating Action Button - Moved out of <main> to root for reliable fixed positioning */}
			<DraggableFAB show={true} onClick={() => setCreateOpen(true)} />

			{/* Details Modal */}
			<Dialog
				open={!!selectedTodoId && !editingTodoId}
				onOpenChange={open => {
					if (!open) {
						setSelectedTodoId(null);
						setIsModalEditing(false);
					}
				}}
			>
				<DialogContent className='w-[95vw] sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Todo Details</DialogTitle>
					</DialogHeader>
					{selectedTodo && (
						<div className='space-y-6'>
							<div className='flex items-start gap-4 py-2 text-foreground'>
								<button
									onClick={() => toggleTodo(selectedTodo.id)}
									className={cn(
										'mt-1 w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0 border',
										selectedTodo.status === 'COMPLETED'
											? 'bg-emerald-600 border-emerald-600 text-white'
											: 'border-zinc-300 bg-white hover:border-zinc-400',
									)}
								>
									{selectedTodo.status === 'COMPLETED' && (
										<Check className='w-4 h-4' />
									)}
								</button>
								<div className='flex-1'>
									{isModalEditing ? (
										<div className='flex flex-col'>
											<Textarea
												ref={modalTitleRef}
												value={editTitle}
												onChange={e => setEditTitle(e.target.value)}
												className='text-lg font-semibold leading-tight min-h-0 p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent shadow-none resize-none overflow-hidden'
												placeholder='Task title'
												rows={1}
											/>
											<Textarea
												ref={modalDescRef}
												value={editDescription}
												onChange={e => setEditDescription(e.target.value)}
												className='text-sm text-muted-foreground font-medium min-h-0 mt-1 p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none bg-transparent resize-none shadow-none overflow-hidden'
												placeholder='Add a description...'
												rows={1}
											/>
											<div className='flex items-center gap-3 justify-end mt-2'>
												<Button
													variant='ghost'
													size='sm'
													className='font-bold text-zinc-500 h-8 px-3'
													onClick={() => setIsModalEditing(false)}
												>
													Cancel
												</Button>
												<Button
													size='sm'
													className='bg-[#0A0B14] hover:bg-black text-white px-5 font-bold rounded-lg h-8'
													onClick={saveEdit}
												>
													Save
												</Button>
											</div>
										</div>
									) : (
										<>
											<h3
												onClick={() => enterModalEdit(selectedTodo, 'title')}
												className={cn(
													'text-lg font-semibold leading-tight cursor-text hover:bg-zinc-50 transition-colors rounded px-1 -ml-1',
													selectedTodo.status === 'COMPLETED' &&
														'text-zinc-400 line-through',
												)}
											>
												{selectedTodo.title}
											</h3>
											<p
												onClick={() =>
													enterModalEdit(selectedTodo, 'description')
												}
												className={cn(
													'text-sm text-muted-foreground mt-1 font-medium cursor-text hover:bg-zinc-50 transition-colors rounded px-1 -ml-1',
													selectedTodo.status === 'COMPLETED' &&
														'text-zinc-300',
												)}
											>
												{selectedTodo.description}
											</p>
										</>
									)}
								</div>
							</div>

							<div className='space-y-2'>
								<label className='text-sm font-bold text-foreground'>
									Priority
								</label>
								<Select
									value={selectedTodo.priority}
									onChange={val => {
										changePriority(selectedTodo.id, val as TodoPriority);
									}}
									options={[
										{
											label: (
												<div className='flex items-center gap-2'>
													<Flag className='w-4 h-4 text-red-500 fill-red-500/20' />
													<span>Priority 1 - Highest</span>
												</div>
											),
											value: 'HIGHEST',
										},
										{
											label: (
												<div className='flex items-center gap-2'>
													<Flag className='w-4 h-4 text-orange-500 fill-orange-500/20' />
													<span>Priority 2 - High</span>
												</div>
											),
											value: 'HIGH',
										},
										{
											label: (
												<div className='flex items-center gap-2'>
													<Flag className='w-4 h-4 text-yellow-500 fill-yellow-500/20' />
													<span>Priority 3 - Medium</span>
												</div>
											),
											value: 'MEDIUM',
										},
										{
											label: (
												<div className='flex items-center gap-2'>
													<Flag className='w-4 h-4 text-blue-500 fill-blue-500/20' />
													<span>Priority 4 - Low</span>
												</div>
											),
											value: 'LOW',
										},
										{
											label: (
												<div className='flex items-center gap-2'>
													<Flag className='w-4 h-4 text-zinc-400 fill-zinc-400/20' />
													<span>Priority 5 - Lowest</span>
												</div>
											),
											value: 'LOWEST',
										},
									]}
									className='w-full'
								/>
							</div>

							<div className='flex justify-end pt-2'>
								<Button
									variant='outline'
									className='text-red-500 border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 gap-2'
									onClick={() => deleteTodo(selectedTodo.id)}
								>
									<Trash2 className='w-4 h-4' />
									Delete
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Create Todo Dialog */}
			<Dialog
				open={createOpen}
				onOpenChange={open => {
					if (!open) {
						setCreateTitle('');
						setCreateDescription('');
						setCreatePriority('LOWEST');
						setCreateOpen(false);
					}
				}}
			>
				<DialogContent className='w-[95vw] sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>New Todo</DialogTitle>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-1'>
							<label className='text-sm font-bold text-foreground'>
								Title <span className='text-red-500'>*</span>
							</label>
							<Input
								value={createTitle}
								onChange={e => setCreateTitle(e.target.value)}
								placeholder='Task title'
								autoFocus
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-bold text-foreground'>
								Description
							</label>
							<Textarea
								value={createDescription}
								onChange={e => setCreateDescription(e.target.value)}
								placeholder='Add a description...'
								className='resize-none'
								rows={3}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-bold text-foreground'>
								Priority
							</label>
							<Select
								value={createPriority}
								onChange={val => setCreatePriority(val as TodoPriority)}
								options={[
									{
										label: (
											<div className='flex items-center gap-2'>
												<Flag className='w-4 h-4 text-red-500 fill-red-500/20' />
												<span>Priority 1 - Highest</span>
											</div>
										),
										value: 'HIGHEST',
									},
									{
										label: (
											<div className='flex items-center gap-2'>
												<Flag className='w-4 h-4 text-orange-500 fill-orange-500/20' />
												<span>Priority 2 - High</span>
											</div>
										),
										value: 'HIGH',
									},
									{
										label: (
											<div className='flex items-center gap-2'>
												<Flag className='w-4 h-4 text-yellow-500 fill-yellow-500/20' />
												<span>Priority 3 - Medium</span>
											</div>
										),
										value: 'MEDIUM',
									},
									{
										label: (
											<div className='flex items-center gap-2'>
												<Flag className='w-4 h-4 text-blue-500 fill-blue-500/20' />
												<span>Priority 4 - Low</span>
											</div>
										),
										value: 'LOW',
									},
									{
										label: (
											<div className='flex items-center gap-2'>
												<Flag className='w-4 h-4 text-zinc-400 fill-zinc-400/20' />
												<span>Priority 5 - Lowest</span>
											</div>
										),
										value: 'LOWEST',
									},
								]}
								className='w-full'
							/>
						</div>
						<div className='flex justify-end gap-2 pt-2'>
							<Button
								variant='ghost'
								onClick={() => {
									setCreateTitle('');
									setCreateDescription('');
									setCreatePriority('LOWEST');
									setCreateOpen(false);
								}}
							>
								Cancel
							</Button>
							<Button
								className='bg-[#0A0B14] hover:bg-black text-white'
								onClick={handleCreate}
								disabled={!createTitle.trim() || isSaving}
							>
								{isSaving ? 'Creating...' : 'Create'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</section>
	);
}
