'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type Option = { id: string; label: string; shortLabel?: string };

export function CustomSelect({
  options,
  value,
  onChange,
  className = '',
  disabled = false,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) || options[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={`svc-select ${className}${open ? ' open' : ''}`} ref={ref}>
      <button
        type="button"
        className="svc-trigger"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="svc-value">{(selected.shortLabel || selected.label).charAt(0).toUpperCase() + (selected.shortLabel || selected.label).slice(1)}</span>
        <ChevronDown size={16} className={'svc-chevron' + (open ? ' up' : '')} />
      </button>
      {open && (
        <ul className="svc-list" role="listbox">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                onClick={() => { onChange(o.id); setOpen(false); }}
              >
                <span className="svc-label single"><b>{o.label.charAt(0).toUpperCase() + o.label.slice(1)}</b></span>
                {o.id === value && <Check size={15} className="svc-check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
