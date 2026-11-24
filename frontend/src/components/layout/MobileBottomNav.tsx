import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
  Home, 
  Compass, 
  Sparkles, 
  Calendar, 
  FileText 
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const items = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Check', href: '/quick-check', icon: Sparkles, isHighlight: true },
    { label: 'Plan', href: '/plan', icon: Calendar },
    { label: 'Passport', href: '/passport', icon: FileText },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-line safe-area-inset-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center min-h-[44px] py-1 text-[11px] font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-ink',
                  item.isHighlight && 'text-gold-hover font-bold',
                  isActive
                    ? 'text-ink font-bold'
                    : 'text-muted hover:text-ink'
                )
              }
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-colors',
                  item.isHighlight && 'bg-gold-surface border border-gold/40'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              </div>
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
