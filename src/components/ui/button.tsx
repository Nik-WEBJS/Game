import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ children, variant = 'primary', size = 'md', className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' && 'bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500',
        variant === 'secondary' && 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600 focus:ring-zinc-500',
        variant === 'danger' && 'bg-red-600/80 text-white hover:bg-red-500 focus:ring-red-500',
        variant === 'ghost' && 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 focus:ring-zinc-500',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
