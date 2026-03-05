'use client';

import { cn } from '@/shared/lib';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

interface SelectProps {
	value: string;
	onChange: (value: string) => void;
	options: { label: React.ReactNode | string; value: string }[];
	placeholder?: string;
	className?: string;
}

const EMPTY_VALUE = '__empty__';

export function Select({
	value,
	onChange,
	options,
	placeholder,
	className,
}: SelectProps) {
	const mappedValue = value === '' ? EMPTY_VALUE : value;
	const selectedOption = options.find(opt => opt.value === value);

	return (
		<div className={cn('relative', className)}>
			<RadixSelect.Root
				value={mappedValue}
				onValueChange={v => onChange(v === EMPTY_VALUE ? '' : v)}
				// @ts-expect-error - Radix types might not show 'modal' but it prevents scroll lock
				modal={false}
			>
				<RadixSelect.Trigger
					className={cn(
						'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
						'hover:bg-accent hover:text-accent-foreground transition-colors',
						'focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
						'text-foreground',
					)}
				>
					<RadixSelect.Value placeholder={placeholder}>
						{selectedOption?.label || placeholder}
					</RadixSelect.Value>
					<RadixSelect.Icon asChild>
						<ChevronDown className='h-4 w-4 opacity-50' />
					</RadixSelect.Icon>
				</RadixSelect.Trigger>

				<RadixSelect.Content
					position='popper'
					sideOffset={4}
					className={cn(
						'z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-white text-popover-foreground shadow-md',
						'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
						'w-(--radix-select-trigger-width)',
					)}
				>
					<RadixSelect.ScrollUpButton className='flex cursor-default items-center justify-center py-1 bg-white z-10'>
						<ChevronUp className='h-4 w-4' />
					</RadixSelect.ScrollUpButton>

					<RadixSelect.Viewport className='p-1'>
						{options.map(opt => (
							<RadixSelect.Item
								key={opt.value}
								value={opt.value === '' ? EMPTY_VALUE : opt.value}
								className={cn(
									'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none',
									'focus:bg-zinc-100 focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
									'transition-colors',
								)}
							>
								<RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
								<span className='absolute right-2 flex h-3.5 w-3.5 items-center justify-center'>
									<RadixSelect.ItemIndicator>
										<Check className='h-4 w-4 opacity-70' />
									</RadixSelect.ItemIndicator>
								</span>
							</RadixSelect.Item>
						))}
					</RadixSelect.Viewport>

					<RadixSelect.ScrollDownButton className='flex cursor-default items-center justify-center py-1 bg-white z-10'>
						<ChevronDown className='h-4 w-4' />
					</RadixSelect.ScrollDownButton>
				</RadixSelect.Content>
			</RadixSelect.Root>
		</div>
	);
}
