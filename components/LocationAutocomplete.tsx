'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, MapPin, Search as SearchIcon } from 'lucide-react';
import { MOROCCAN_CITIES, MOROCCAN_NEIGHBORHOODS } from '@/lib/morocco-locations';

type Mode = 'city' | 'neighborhood' | 'address';
type Suggestion = { label: string; secondary?: string; placeId?: string; source: 'google' | 'local' | 'geo'; lat?: number; lng?: number };

let googlePromise: Promise<any> | null = null;
function loadGoogle(): Promise<any> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error('NO_KEY'));
  if (typeof window === 'undefined') return Promise.reject(new Error('NO_WINDOW'));
  if ((window as any).google?.maps?.places) return Promise.resolve((window as any).google);
  if (googlePromise) return googlePromise;
  googlePromise = new Promise((resolve, reject) => {
    const cb = '__hlaqtiGmapCb';
    (window as any)[cb] = () => resolve((window as any).google);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=fr&region=ma&callback=${cb}`;
    s.async = true; s.defer = true;
    s.onerror = () => reject(new Error('LOAD_FAILED'));
    document.head.appendChild(s);
  });
  return googlePromise;
}

// Recherche de secours (sans clé API) sur les villes/quartiers connus du Maroc.
function localSearch(q: string, mode: Mode): Suggestion[] {
  const query = q.toLowerCase().trim();
  if (query.length < 1) return [];
  if (mode === 'address' || mode === 'neighborhood') {
    const hoods = MOROCCAN_NEIGHBORHOODS.filter((h) => h.name.toLowerCase().includes(query))
      .slice(0, 6)
      .map((h) => ({ label: h.name, secondary: `Quartier · ${h.city}, Maroc`, source: 'local' as const }));
    const cities = MOROCCAN_CITIES.filter((c) => c.toLowerCase().includes(query))
      .slice(0, 4)
      .map((label) => ({ label, secondary: 'Ville · Maroc', source: 'local' as const }));
    return [...hoods, ...cities].slice(0, 8);
  }
  return MOROCCAN_CITIES.filter((c) => c.toLowerCase().includes(query))
    .slice(0, 7)
    .map((label) => ({ label, secondary: 'Ville · Maroc', source: 'local' as const }));
}

export function LocationAutocomplete({
  mode = 'city',
  value,
  onChange,
  onPlace,
  placeholder,
  icon,
  withGeolocation = false,
}: {
  mode?: Mode;
  value: string;
  onChange: (val: string) => void;
  onPlace?: (val: { label: string; secondary?: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  withGeolocation?: boolean;
}) {
  const [input, setInput] = useState(value || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [usingGoogle, setUsingGoogle] = useState(false);
  const [locating, setLocating] = useState(false);
  const acRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(value || ''); }, [value]);

  useEffect(() => {
    let active = true;
    loadGoogle()
      .then((g) => {
        if (!active) return;
        setUsingGoogle(true);
        acRef.current = new g.maps.places.AutocompleteService();
        geocoderRef.current = new g.maps.Geocoder();
      })
      .catch(() => { if (active) setUsingGoogle(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (input === value) return;
    if (input.trim().length < 2) { setSuggestions(localSearch(input, mode)); setOpen(input.trim().length >= 1); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      if (usingGoogle && acRef.current) {
        // address = établissements/adresses exactes ; city = villes uniquement
        const types = mode === 'city' ? ['(cities)'] : mode === 'address' ? ['address', 'establishment', 'geocode'] : [];
        acRef.current.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'ma' },
            language: 'fr',
            region: 'ma',
            ...(types.length ? { types } : {}),
          },
          (predictions: any[] | null, status: any) => {
            if (cancelled) return;
            if (status === 'OK' && predictions && predictions.length) {
              setSuggestions(
                predictions.slice(0, 7).map((p) => ({
                  label: p.structured_formatting?.main_text || p.description,
                  secondary: p.structured_formatting?.secondary_text || 'Maroc',
                  placeId: p.place_id,
                  source: 'google',
                }))
              );
              setOpen(true);
            } else {
              setSuggestions(localSearch(input, mode));
              setOpen(true);
            }
          }
        );
      } else {
        setSuggestions(localSearch(input, mode));
        setOpen(true);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [input, usingGoogle, mode, value]);

  const poweredByGoogle = useMemo(() => usingGoogle && suggestions.some((s) => s.source === 'google'), [usingGoogle, suggestions]);

  function pick(s: Suggestion) {
    setInput(s.label);
    onChange(s.label);
    onPlace?.({ label: s.label, secondary: s.secondary, lat: s.lat, lng: s.lng });
    setOpen(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (usingGoogle && geocoderRef.current) {
          geocoderRef.current.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
            setLocating(false);
            if (status === 'OK' && results?.[0]) {
              const label = results[0].formatted_address.replace(', Morocco', '').replace(', Maroc', '');
              setInput(label);
              onChange(label);
              onPlace?.({ label, lat: latitude, lng: longitude });
            } else {
              const label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              setInput(label); onChange(label); onPlace?.({ label, lat: latitude, lng: longitude });
            }
          });
        } else {
          // sans clé Google : on affiche quand même les coordonnées
          setLocating(false);
          const label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (position)`;
          setSuggestions([{ label, secondary: 'Ta position actuelle', source: 'geo', lat: latitude, lng: longitude }]);
          setOpen(true);
        }
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  }

  return (
    <div className={'location-ac' + (open && (suggestions.length || withGeolocation) ? ' open' : '')} ref={boxRef}>
      <div className="location-ac-input">
        {icon ?? <MapPin size={16} />}
        <input
          value={input}
          placeholder={placeholder}
          onFocus={() => { if (input.trim().length >= 1) setOpen(true); }}
          onChange={(e) => { setInput(e.target.value); onChange(e.target.value); setOpen(e.target.value.trim().length >= 1); }}
          autoComplete="off"
        />
        {input && <button type="button" className="loc-clear" onClick={() => { setInput(''); onChange(''); setSuggestions([]); }}>×</button>}
        {withGeolocation && (
          <button type="button" className={'loc-geo' + (locating ? ' spin' : '')} onClick={useMyLocation} title="Utiliser ma position" aria-label="Ma position">
            <LocateFixed size={15} />
          </button>
        )}
      </div>
      {open && (suggestions.length > 0 || withGeolocation) && (
        <ul className="location-list">
          {withGeolocation && (
            <li className="geo-item" onMouseDown={(e) => { e.preventDefault(); useMyLocation(); }}>
              <LocateFixed size={14} />
              <span><b>Utiliser ma position</b><small>Trouve les salons autour de toi</small></span>
            </li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.placeId || `${s.label}-${i}`} onMouseDown={(e) => { e.preventDefault(); pick(s); }}>
              {s.source === 'geo' ? <LocateFixed size={14} /> : <SearchIcon size={14} />}
              <span><b>{s.label}</b><small>{s.secondary}</small></span>
              {s.source === 'google' && <em className="g-badge">Google</em>}
            </li>
          ))}
          {poweredByGoogle && (
            <li className="powered-google">
              <svg viewBox="0 0 136 18" width="70" aria-label="Powered by Google">
                <path fill="#4285F4" d="M10.4 9.2a4.1 4.1 0 0 1-7.5-2.3A4.1 4.1 0 0 1 9.8 5l1.7-1.7A6.4 6.4 0 1 0 6.4 15a6.4 6.4 0 0 0 6-9z"/>
                <text x="20" y="14" fontSize="11" fontFamily="Arial" fill="#777">Propulsé par Google</text>
              </svg>
            </li>
          )}
          {!usingGoogle && (
            <li className="powered-local">Saisie assistée · ajoute ta clé Google Maps pour les adresses exactes</li>
          )}
        </ul>
      )}
    </div>
  );
}
