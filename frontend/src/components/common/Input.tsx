import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  whyWeAsk?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      leftIcon,
      whyWeAsk,
      className,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const [showWhy, setShowWhy] = React.useState(false);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-xs font-semibold tracking-wide text-ink uppercase"
            >
              {label}
              {required && <span className="text-red-600 ml-1" aria-hidden="true">*</span>}
            </label>
            {whyWeAsk && (
              <button
                type="button"
                onClick={() => setShowWhy(!showWhy)}
                className="text-xs text-muted hover:text-ink underline decoration-dotted underline-offset-2 transition-colors"
                aria-expanded={showWhy}
              >
                Why we ask
              </button>
            )}
          </div>
        )}

        {whyWeAsk && showWhy && (
          <div className="text-xs bg-paper-muted border border-line p-2.5 rounded text-ink/80 leading-relaxed">
            <span className="font-semibold text-ink">Scheme Requirement: </span>
            {whyWeAsk}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className="absolute left-3.5 text-muted pointer-events-none flex items-center"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full min-h-[44px] px-3.5 py-2 text-sm bg-paper-surface border border-line rounded-md text-ink placeholder:text-muted/60 transition-colors',
              'hover:border-line-dark focus:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1',
              'disabled:bg-paper-muted disabled:text-muted disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              error && 'border-red-600 focus:border-red-600',
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-red-600 flex items-center gap-1 font-medium">
            <span>•</span> {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
