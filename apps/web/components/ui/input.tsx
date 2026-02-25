import { cn } from '@/lib/utils';
import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps) {
	return (
		<input
			type={type}
			className={cn(
				'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
				'placeholder:text-muted-foreground',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
				'disabled:cursor-not-allowed disabled:opacity-50',
				'transition-colors',
				className,
			)}
			{...props}
		/>
	);
}
