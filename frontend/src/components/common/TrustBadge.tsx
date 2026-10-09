import React from 'react';
import { cn } from '../../utils/cn';
import { ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';

export type SourceTier = 'TIER_1_OFFICIAL' | 'TIER_2_SECONDARY';

export interface TrustBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier?: SourceTier;
  verifiedYear?: string;
  sourceUrl?: string;
  sourceName?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  tier = 'TIER_1_OFFICIAL',
  verifiedYear = '2026–27',
  sourceUrl,
  sourceName = 'Official Source',
  className,
  ...props
}) => {
  const isOfficial = tier === 'TIER_1_OFFICIAL';

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border select-none transition-colors',
        isOfficial
          ? 'bg-paper-surface border-line text-ink hover:border-line-dark'
          : 'bg-paper-muted border-line text-muted',
        className
      )}
      {...props}
    >
      {isOfficial ? (
        <ShieldCheck className="w-3.5 h-3.5 text-green shrink-0" aria-hidden="true" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5 text-gold shrink-0" aria-hidden="true" />
      )}
      <span className="font-semibold">{sourceName}</span>
      <span className="text-muted text-[11px]">({verifiedYear})</span>
      {sourceUrl && (
        <ExternalLink className="w-3 h-3 text-muted ml-0.5 shrink-0" aria-hidden="true" />
      )}
    </span>
  );

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex focus-visible:outline-2 focus-visible:outline-ink rounded-md"
        title={`View published criteria at ${sourceName}`}
      >
        {content}
      </a>
    );
  }

  return content;
};
