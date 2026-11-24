import React, { useEffect, useState } from 'react';
import { WifiOff, ShieldAlert } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-ink text-paper text-xs px-4 py-2 border-b border-line flex items-center justify-between transition-all"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <WifiOff className="w-4 h-4 text-gold shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Offline Mode Active:</strong> You are browsing offline. ScholarPath remains fully operational using cached criteria and verified local fixtures.
        </span>
      </div>
    </div>
  );
};

export const DemoModeBanner: React.FC = () => {
  return (
    <div className="bg-gold-surface border-b border-gold/40 text-ink text-xs px-4 py-1.5 flex items-center justify-between select-none">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-ink shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-bold">DEMO MODE:</strong> Operating with verified local scheme criteria (Academic Year 2026–27).
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] text-muted font-medium">
          Rules decide · AI explains · Authority approves
        </span>
      </div>
    </div>
  );
};
