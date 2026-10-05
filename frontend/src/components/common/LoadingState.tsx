import React from 'react';
import { cn } from '../../utils/cn';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Evaluating eligibility against published criteria...',
  subMessage = 'Checking income limits, academic criteria, and social category rules',
  className,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg bg-paper-surface/60 border border-line max-w-md mx-auto',
        className
      )}
      {...props}
    >
      <div className="relative w-10 h-10 mb-4 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-line rounded-full" />
        <div className="w-10 h-10 border-2 border-ink border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm font-semibold text-ink mb-1">{message}</p>
      {subMessage && (
        <p className="text-xs text-muted max-w-xs leading-relaxed">{subMessage}</p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
};
