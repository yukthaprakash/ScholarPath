import React from 'react';
import { cn } from '../../utils/cn';
import { Info } from 'lucide-react';

export interface DisclaimerProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({
  compact = false,
  className,
  ...props
}) => {
  return (
    <div
      role="note"
      aria-label="Official Authority Eligibility Disclaimer"
      className={cn(
        'flex items-start gap-2.5 border rounded-md text-xs leading-relaxed select-none',
        compact
          ? 'p-2.5 bg-paper-muted/80 border-line text-muted'
          : 'p-3.5 bg-paper-surface border-line text-ink/80 shadow-subtle',
        className
      )}
      {...props}
    >
      <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <span className="font-semibold text-ink">Important Notice: </span>
        <span>
          Preliminary assessment based on published criteria. Final eligibility is determined by the respective authority.
        </span>
      </div>
    </div>
  );
};
