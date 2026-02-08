import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-zinc-700 text-zinc-300',
  success: 'bg-emerald-900/60 text-emerald-400 border-emerald-700/50',
  warning: 'bg-amber-900/60 text-amber-400 border-amber-700/50',
  danger: 'bg-red-900/60 text-red-400 border-red-700/50',
  info: 'bg-blue-900/60 text-blue-400 border-blue-700/50',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
