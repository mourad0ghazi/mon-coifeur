'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import {
  Check, Clock3, Grid2X2, List, MapPin, Search, SlidersHorizontal, Star, X,
} from 'lucide-react';

type Salon = {
  id: string; slug: string; name: string; barberName: string; neighborhood: string; city: string;
  rating: number; reviews: number; priceFrom: number; verified: boolean;
  services: { id: string; label: string; duration: number; price: number }[];
  specialties: string[]; nextSlot?: { label: string; time: string; date?: string } | null;
  distanceKm?: number; image: string;
  openStatus?: { open: boolean; label: string; until?: string };
};

function dateOptions() {
  const now = new Date(); const opts: { id: string; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    opts.push({
      id: d.toISOString().slice(0, 10),
      label: i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }
  return opts;
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [quartier, setQuartier] = useState('');
  const [service, setService] = useState('Tous');
  const [date, setDate] = useState(dateOptions()[0].id);
  const [sort, setSort] = useState('disponibilite');
  const [maxPrice, setMaxPrice] = useState(200);
  const [verified, setVerified] = useState(false);
  const [filters, setFilters] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [results, setResults] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const dates = dateOptions();

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('q')) setQ(p.get('q')!);
    if (p.get('ville')) setCity(p.get('ville')!);
    if (p.get('quartier')) setQuartier(p.get('quartier')!);
    if (p.get('service')) setService(p.get('service')!);
    if (p.get('date')) setDate(p.get('date')!);
  }, []);

  useEffect(() => {
    let cancel = false;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('ville', city);
    if (quartier) params.set('quartier', quartier);
    if (service !== 'Tous') params.set('service', service);
    params.set('prix', String(maxPrice));
    if (verified) params.set('verifie', '1');
    params.set('tri', sort);
    params.set('date', date);
    setLoading(true);
    fetch('/api/v1/search?' + params.toString())
      .then((r) => r.json())
      .then((j) => { if (!cancel) setResults(j.data?.results || []); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [q, city, quartier, service, maxPrice, verified, sort, date]);

  const allServices = useMemo(() => {
    const m = new Map<string, string>();
    results.forEach((s) => s.services.forEach((sv) => m.set(sv.id, sv.label)));
    return Array.from(m.entries());
  }, [results]);

  return (
    <>
      <div className="inner-head"><Header /></div>
      <main className="professional-search">
        <section className="search-command">
          <div className="container">
            <div className="search-title">
              <span className="section-kicker">RECHERCHE EN TEMPS RÉEL · MAROC</span>
              <h1>Trouve la bonne chaise.</h1>
              <p>Compare les styles, les prix et les vrais créneaux disponibles.</p>
            </div>
            <div className="search-console professional-console">
              <label className="query">
                <Search />
                <span>
                  <small>QUE CHERCHES-TU ?</small>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Salon, coiffeur ou coupe…" />
                </span>
                {q && <button onClick={() => setQ('')}><X /></button>}
              </label>
              <div className="loc-pair">
                <LocationAutocomplete mode="city" value={city} onChange={setCity} placeholder="Ville" />
                <LocationAutocomplete mode="neighborhood" value={quartier} onChange={setQuartier} placeholder="Quartier" />
              </div>
              <label className="date-pick">
                <Clock3 />
                <span><small>QUAND ?</small>
                  <select value={date} onChange={(e) => setDate(e.target.value)}>
                    {dates.map((d) => <option key={d.id} value={d.id}>{d.label.charAt(0).toUpperCase() + d.label.slice(1)}</option>)}
                  </select>
                </span>
              </label>
            </div>
          </div>
        </section>

        <div className="container search-workspace">
          <aside className={filters ? 'mobile-show' : ''}>
            <header>
              <b>Filtres</b>
              <button onClick={() => { setCity('Casablanca'); setQuartier(''); setService('Tous'); setMaxPrice(200); setVerified(false); }}>Tout effacer</button>
              <button className="close-filters" onClick={() => setFilters(false)}><X /></button>
            </header>
            <section>
              <h3>Service</h3>
              <div className="filter-chips">
                <button className={service === 'Tous' ? 'active' : ''} onClick={() => setService('Tous')}>Tous</button>
                {allServices.map(([id, label]) => (
                  <button key={id} className={service === id ? 'active' : ''} onClick={() => setService(id)}>{label}</button>
                ))}
              </div>
            </section>
            <section>
              <h3>Prix maximum <b>{maxPrice} MAD</b></h3>
              <input type="range" min="30" max="200" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
              <div className="range-label"><span>30 MAD</span><span>200+ MAD</span></div>
            </section>
            <section>
              <h3>Qualité</h3>
              <label className="filter-check">
                <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
                <i><Check /></i> Profil vérifié
              </label>
            </section>
            <button className="apply-mobile" onClick={() => setFilters(false)}>Afficher {results.length} résultats</button>
          </aside>

          <section className="search-results">
            <header>
              <div>
                <h2>{loading ? 'Recherche…' : `${results.length} salon(s) disponible(s)`}</h2>
                <p>{city}{quartier ? ` · ${quartier}` : ''} · créneaux calculés en temps réel</p>
              </div>
              <button className="mobile-filter" onClick={() => setFilters(true)}><SlidersHorizontal /> Filtres</button>
              <div className="view-buttons">
                <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List /></button>
                <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Grid2X2 /></button>
              </div>
              <label>Trier par :
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="disponibilite">Disponibilité</option>
                  <option value="note">Note</option>
                  <option value="distance">Distance</option>
                </select>
              </label>
            </header>

            <div className={'professional-results ' + view}>
              {results.map((s) => (
                <article key={s.id}>
                  <div className="result-photo">
                    <Image src={s.image} fill alt={s.name} />
                    {s.openStatus?.open
                      ? <span className="res-badge open"><i className="blink"/> OUVERT</span>
                      : <span className="res-badge closed"><i/> FERMÉ</span>}
                    {s.verified && <em><Check /> VÉRIFIÉ</em>}
                  </div>
                  <div className="result-info">
                    <div className="result-name">
                      <div>
                        <h3>{s.name}</h3>
                        <p><MapPin /> {s.neighborhood}, {s.city} · {s.distanceKm ?? '—'} km</p>
                      </div>
                      <strong><Star fill="currentColor" /> {s.rating}<small>{s.reviews} avis</small></strong>
                    </div>
                    <div className="result-services">
                      {s.services.slice(0, 3).map((x) => <span key={x.id}>{x.label}</span>)}
                    </div>
                    <div className="result-availability">
                      <Clock3 />
                      <span><small>PROCHAIN CRÉNEAU</small><b>{s.nextSlot?.label || '—'}</b></span>
                      <div><small>À partir de</small><b>{s.priceFrom} MAD</b></div>
                    </div>
                    <footer>
                      <Link href={`/salons/${s.slug}`}>Voir le salon</Link>
                      <Link href={`/reserver/${s.slug === 'mouad' ? 'karim' : s.id}`}>Réserver</Link>
                    </footer>
                  </div>
                </article>
              ))}
            </div>

            {!loading && results.length === 0 && (
              <div className="no-results">
                <Search />
                <h3>Aucun résultat avec ces filtres.</h3>
                <p>Élargis le prix ou choisis un autre quartier.</p>
                <button onClick={() => { setCity('Casablanca'); setQuartier(''); setService('Tous'); setMaxPrice(200); setVerified(false); }}>Réinitialiser les filtres</button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
