import React from 'react';
import { cn } from '../../utils/cn';
import { FolderSearch } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-line rounded-lg bg-paper-surface/50 max-w-lg mx-auto',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-paper-muted border border-line flex items-center justify-center text-muted mb-4 shrink-0">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-sm text-muted mb-6 max-w-sm leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
