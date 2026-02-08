import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0..100
  max?: number;
  color?: 'emerald' | 'red' | 'amber' | 'blue' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const colorMap = {
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
};

export function ProgressBar({
  value,
  max = 100,
  color = 'emerald',
  size = 'md',
  label,
  showValue = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-zinc-400">{label}</span>}
          {showValue && <span className="text-xs text-zinc-400">{Math.round(value)}/{max}</span>}
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-zinc-700/50 overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
