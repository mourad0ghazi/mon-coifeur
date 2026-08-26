'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarCheck, MapPin, Search, Sparkles } from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { ServiceSelect } from './ServiceSelect';
import { CustomSelect } from './CustomSelect';

const SERVICES = [
  { id: '', label: 'Tous services' },
  { id: 'degrade-americain', label: 'Dégradé américain', duration: 40, price: 60 },
  { id: 'taper-fade', label: 'Taper fade', duration: 35, price: 55 },
  { id: 'coupe-barbe', label: 'Coupe + barbe', duration: 55, price: 85 },
  { id: 'barbe', label: 'Taille de barbe', duration: 25, price: 30 },
  { id: 'enfant', label: 'Coupe enfant', duration: 30, price: 40 },
  { id: 'ciseaux', label: 'Coupe aux ciseaux', duration: 45, price: 70 },
];

// Recherches rapides populaires
const POPULAR = [
  { label: 'Dégradé', service: 'degrade-americain' },
  { label: 'Coupe + barbe', service: 'coupe-barbe' },
  { label: 'Enfant', service: 'enfant' },
  { label: 'Ouvert maintenant', open: true },
];

function dateOptions() {
  const opts: { id: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    opts.push({
      id: d.toISOString().slice(0, 10),
      label: i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }),
    });
  }
  return opts;
}

export function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState('Casablanca');
  const [quartier, setQuartier] = useState('');
  const [service, setService] = useState('');
  const [when, setWhen] = useState(dateOptions()[0].id);
  const [availableNow, setAvailableNow] = useState(0);
  const dates = dateOptions();

  // Compteur live de coiffeurs disponibles (créneau aujourd'hui)
  useEffect(() => {
    fetch(`/api/v1/search?ville=${encodeURIComponent(city)}&quartier=${encodeURIComponent(quartier)}&date=${dates[0].id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.data) setAvailableNow(j.data.count); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(extra?: Record<string, string>) {
    const params = new URLSearchParams();
    if (city) params.set('ville', city);
    if (quartier) params.set('quartier', quartier);
    if (service) params.set('service', service);
    params.set('date', when);
    if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
    router.push('/recherche?' + params.toString());
  }
  function submit(e: React.FormEvent) { e.preventDefault(); go(); }
  function openNow() {
    setWhen(dates[0].id);
    go({ ouvert: '1', tri: 'disponibilite' });
  }
  function pickService(s: string) {
    setService(s);
    setTimeout(() => go({ service: s }), 0);
  }

  return (
    <>
      <form className="hero-search" onSubmit={submit}>
        <label className="hero-field where">
          <span className="field-icon"><MapPin size={18} /></span>
          <span className="field-body">
            <small>OÙ ?</small>
            <LocationAutocomplete mode="city" value={city} onChange={setCity} placeholder="Ville — ex. Casablanca" withGeolocation />
          </span>
        </label>

        <label className="hero-field area">
          <span className="field-icon"><MapPin size={18} /></span>
          <span className="field-body">
            <small>QUARTIER / ADRESSE</small>
            <LocationAutocomplete mode="address" value={quartier} onChange={setQuartier} placeholder="Quartier ou adresse — ex. Maârif" />
          </span>
        </label>

        <div className="hero-field service">
          <span className="field-icon"><Sparkles size={18} /></span>
          <span className="field-body">
            <small>POUR QUOI ?</small>
            <ServiceSelect options={SERVICES} value={service} onChange={setService} icon={null} />
          </span>
        </div>

        <div className="hero-field when">
          <span className="field-icon"><CalendarCheck size={18} /></span>
          <span className="field-body">
            <small>QUAND ?</small>
            <CustomSelect
              options={dates.map((d) => ({ id: d.id, label: d.label.charAt(0).toUpperCase() + d.label.slice(1) }))}
              value={when}
              onChange={setWhen}
            />
          </span>
        </div>

        <button type="submit" className="hero-search-btn"><Search size={20} /> Rechercher</button>
      </form>

      <div className="quick">
        <span>Populaire :</span>
        {POPULAR.map((p) =>
          p.open ? (
            <button key="open" type="button" className="quick-link" onClick={openNow}>{p.label}</button>
          ) : (
            <button key={p.service} type="button" className="quick-link" onClick={() => pickService(p.service!)}>{p.label}</button>
          )
        )}
        <button type="button" className={'quick-available ' + (availableNow > 0 ? 'live' : '')} onClick={openNow}>
          <span className="live-dot" /> {availableNow} coiffeur{availableNow > 1 ? 's' : ''} disponible{availableNow > 1 ? 's' : ''} aujourd’hui
        </button>
      </div>
    </>
  );
}
