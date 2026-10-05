import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex flex-col gap-3 pb-6 border-b border-line mb-6 sm:mb-8', className)}
      {...props}
    >
      {backHref && (
        <Link
          to={backHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink transition-colors -ml-1 py-1 px-1 rounded focus-visible:outline-2 focus-visible:outline-ink w-fit"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-serif">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted mt-1.5 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
};
