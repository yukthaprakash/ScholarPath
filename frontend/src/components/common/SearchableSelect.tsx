import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
}

export interface SearchableSelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value?: string;
  onChange: (value: string, option?: SearchableOption) => void;
  helperText?: string;
  error?: string;
  required?: boolean;
  whyWeAsk?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  placeholder = 'Search or select an option...',
  options,
  value,
  onChange,
  helperText,
  error,
  required,
  whyWeAsk,
  className,
}) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWhy, setShowWhy] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (opt: SearchableOption) => {
    onChange(opt.value, opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={selectId}
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

      <div className="relative">
        <button
          type="button"
          id={selectId}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full min-h-[44px] px-3.5 py-2 text-left bg-paper-surface border border-line rounded-md text-ink flex items-center justify-between transition-colors',
            'hover:border-line-dark focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1',
            error && 'border-red-600'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn('text-sm truncate pr-2', !selectedOption && 'text-muted/60')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0 text-muted">
            {selectedOption && (
              <span
                onClick={handleClear}
                className="p-1 hover:text-ink transition-colors"
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-paper-surface border border-line rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-line bg-paper-muted/40 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to filter..."
                autoFocus
                className="w-full text-xs bg-transparent text-ink placeholder:text-muted/60 focus:outline-none"
              />
            </div>

            <ul className="overflow-y-auto py-1 text-xs" role="listbox">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-muted text-center italic">No matching options</li>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <li
                      key={opt.value}
                      onClick={() => handleSelect(opt)}
                      className={cn(
                        'px-3 py-2 cursor-pointer flex items-center justify-between transition-colors',
                        'hover:bg-paper-muted',
                        isSelected && 'bg-paper-muted font-bold text-ink'
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        {opt.subLabel && (
                          <span className="text-[10px] text-muted">{opt.subLabel}</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-green shrink-0 ml-2" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
          <span>•</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
