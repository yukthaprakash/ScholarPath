import React from 'react';
import { cn } from '../../utils/cn';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  HelpCircle, 
  AlertTriangle 
} from 'lucide-react';

export type EligibilityStatusType =
  | 'ELIGIBLE'
  | 'NEARLY_ELIGIBLE'
  | 'NOT_MATCHED'
  | 'NEEDS_VERIFICATION';

export type PreflightStatusType = 'READY' | 'FIX_FIRST' | 'VERIFY' | 'MISSING';

export type StatusType = EligibilityStatusType | PreflightStatusType;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  size = 'md',
  className,
  ...props
}) => {
  const configMap: Record<
    StatusType,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      styles: string;
    }
  > = {
    ELIGIBLE: {
      label: 'Eligible',
      icon: CheckCircle2,
      styles: 'bg-green-surface text-green border-green/30',
    },
    NEARLY_ELIGIBLE: {
      label: 'Nearly Eligible',
      icon: AlertCircle,
      styles: 'bg-gold-surface text-ink border-gold/50',
    },
    NOT_MATCHED: {
      label: 'Not Matched',
      icon: XCircle,
      styles: 'bg-paper-muted text-muted border-line',
    },
    NEEDS_VERIFICATION: {
      label: 'Needs Verification',
      icon: HelpCircle,
      styles: 'bg-paper-muted text-ink/80 border-line-dark',
    },
    READY: {
      label: 'Ready',
      icon: CheckCircle2,
      styles: 'bg-green-surface text-green border-green/30',
    },
    FIX_FIRST: {
      label: 'Fix First',
      icon: AlertTriangle,
      styles: 'bg-red-50 text-red-700 border-red-200',
    },
    VERIFY: {
      label: 'Verify',
      icon: HelpCircle,
      styles: 'bg-gold-surface text-ink border-gold/40',
    },
    MISSING: {
      label: 'Missing',
      icon: XCircle,
      styles: 'bg-paper-muted text-muted border-line',
    },
  };


  const config = configMap[status] || {
    label: status,
    icon: HelpCircle,
    styles: 'bg-paper-muted text-muted border-line',
  };

  const Icon = config.icon;
  const displayText = customLabel || config.label;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs gap-1.5';
  const iconSizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md border tracking-wide select-none',
        config.styles,
        sizeClasses,
        className
      )}
      {...props}
    >
      <Icon className={cn('shrink-0', iconSizeClasses)} aria-hidden="true" />
      <span>{displayText}</span>
    </span>
  );
};
