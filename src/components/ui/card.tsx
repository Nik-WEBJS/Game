import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function Card({ children, className, onClick, selected, disabled }: CardProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={cn(
        'rounded-xl border bg-zinc-900/80 p-4 backdrop-blur-sm transition-all',
        onClick && !disabled && 'cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-800/80',
        selected && 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/30',
        disabled && 'opacity-50 cursor-not-allowed',
        !selected && 'border-zinc-700/50',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-zinc-100', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm text-zinc-400', className)}>{children}</p>;
}
