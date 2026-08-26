'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Scissors, Sparkles } from 'lucide-react';

export type ServiceOption = { id: string; label: string; duration?: number; price?: number };

export function ServiceSelect({
  options,
  value,
  onChange,
  icon,
}: {
  options: ServiceOption[];
  value: string;
  onChange: (id: string) => void;
  icon?: React.ReactNode;
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
    <div className={'svc-select' + (open ? ' open' : '')} ref={ref}>
      <button
        type="button"
        className="svc-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon ?? <Sparkles size={18} />}
        <span className="svc-value">{selected.label}</span>
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
                <span className="svc-ic"><Scissors size={13} /></span>
                <span className="svc-label">
                  <b>{o.label}</b>
                  {o.duration != null && (
                    <small>{o.duration} min{o.price != null ? ` · ${o.price} MAD` : ''}</small>
                  )}
                </span>
                {o.id === value && <Check size={15} className="svc-check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
