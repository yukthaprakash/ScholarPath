import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'green';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 select-none focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';

    const variants = {
      primary: 'bg-ink text-paper hover:bg-ink/90 active:bg-ink shadow-subtle',
      secondary: 'bg-paper-surface border border-line text-ink hover:bg-paper-muted/60 active:bg-paper-muted',
      outline: 'bg-transparent border border-line text-ink hover:bg-paper-muted/40 active:bg-paper-muted',
      ghost: 'bg-transparent text-muted hover:text-ink hover:bg-paper-muted/50 active:bg-paper-muted',
      gold: 'bg-gold text-ink font-semibold hover:bg-gold-hover active:bg-gold shadow-subtle',
      green: 'bg-green text-paper hover:bg-green-hover active:bg-green shadow-subtle',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
            aria-hidden="true"
          />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
