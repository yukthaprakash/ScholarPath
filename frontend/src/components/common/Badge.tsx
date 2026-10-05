import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'outline' | 'green' | 'gold';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded border select-none tracking-wide';

  const variants = {
    neutral: 'bg-paper-muted text-ink/90 border-line',
    outline: 'bg-transparent text-muted border-line',
    green: 'bg-green-surface text-green border-green/20',
    gold: 'bg-gold-surface text-ink border-gold/40',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
