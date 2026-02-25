import * as React from "react";
import { cn } from "@/shared/lib";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground bg-transparent",
};

export function Badge({
  className,
  variant = "secondary",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
