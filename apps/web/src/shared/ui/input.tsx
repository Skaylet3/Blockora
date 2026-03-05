import { cn } from '@/shared/lib';
import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				ref={ref}
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
	},
);

Input.displayName = 'Input';
