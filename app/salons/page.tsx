'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  ListFilter,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { CustomSelect } from '@/components/CustomSelect';
import { SalonMap } from '@/components/SalonMap';

type LiveStatus = {
  open: boolean;
  label: string;
  until?: string;
  pause?: boolean;
};

type Salon = {
  id: string;
  slug: string;
  name: string;
  barberName: string;
  neighborhood: string;
  city: string;
  address: string;
  rating: number;
  reviews: number;
  priceFrom: number;
  verified: boolean;
  latitude: number;
  longitude: number;
  services: { id: string; label: string; duration: number; price: number }[];
  specialties: string[];
  nextSlot?: { label: string; time: string; date?: string } | null;
  distanceKm?: number;
  image: string;
  openStatus?: LiveStatus;
};

type Query = {
  q: string;
  city: string;
  quartier: string;
  service: string;
  openOnly: boolean;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
};

const SERVICE_OPTIONS = [
  { id: 'Tous', label: 'Tous les services' },
  { id: 'degrade-americain', label: 'Dégradé américain' },
  { id: 'taper-fade', label: 'Taper fade' },
  { id: 'coupe-barbe', label: 'Coupe + barbe' },
  { id: 'barbe', label: 'Barbe' },
  { id: 'enfant', label: 'Coupe enfant' },
  { id: 'ciseaux', label: 'Coupe aux ciseaux' },
];

const RADIUS_OPTIONS = [
  { id: '2', label: '2 km · très proche', shortLabel: '2 km' },
  { id: '5', label: '5 km · quartier', shortLabel: '5 km' },
  { id: '10', label: '10 km · Casablanca', shortLabel: '10 km' },
  { id: '20', label: '20 km · alentours', shortLabel: '20 km' },
];

const DEFAULT_QUERY: Query = {
  q: '',
  city: 'Casablanca',
  quartier: '',
  service: 'Tous',
  openOnly: false,
  latitude: null,
  longitude: null,
  radiusKm: 10,
};

function reservationHref(salon: Salon) {
  // Karim est le coiffeur de démonstration actuellement connecté aux créneaux.
  // Le slug est conservé dans l’URL pour que la fiche reste identifiable.
  return salon.id === 'salon-mouad' ? '/reserver/karim' : `/reserver/karim?salon=${encodeURIComponent(salon.slug)}`;
}

function mapsHref(salon: Salon) {
  return `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`;
}

export default function Salons() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [quartier, setQuartier] = useState('');
  const [service, setService] = useState('Tous');
  const [openOnly, setOpenOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [applied, setApplied] = useState<Query>(DEFAULT_QUERY);
  const [results, setResults] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapQuery, setMapQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mobileMap, setMobileMap] = useState(false);

  const loadResults = useCallback(async (query: Query, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.city) params.set('ville', query.city);
    if (query.quartier) params.set('quartier', query.quartier);
    if (query.service !== 'Tous') params.set('service', query.service);
    if (query.openOnly) params.set('ouvert', '1');
    if (query.latitude != null && query.longitude != null) {
      params.set('lat', String(query.latitude));
      params.set('lng', String(query.longitude));
      params.set('rayon', String(query.radiusKm));
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/v1/search?${params.toString()}`, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error('SEARCH_FAILED');
      const payload = await response.json();
      const salons = (payload.data?.results || []) as Salon[];
      setResults(salons);
      setLastUpdated(new Date());
      setSelectedId((current) => (current && salons.some((salon) => salon.id === current) ? current : salons[0]?.id || null));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('La recherche est momentanément indisponible. Réessaie dans un instant.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadResults(applied, controller.signal);
    // Les horaires et les créneaux sont recalculés régulièrement sans recharger la page.
    const refresh = window.setInterval(() => void loadResults(applied), 45_000);
    return () => {
      controller.abort();
      window.clearInterval(refresh);
    };
  }, [applied, loadResults]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied({
      q: q.trim(),
      // Une position GPS prend le dessus sur les filtres ville/quartier afin
      // de fonctionner aussi pour un utilisateur à Rabat, Marrakech, etc.
      city: userLocation ? '' : city.trim(),
      quartier: userLocation ? '' : quartier.trim(),
      service,
      openOnly,
      latitude: userLocation?.lat ?? null,
      longitude: userLocation?.lng ?? null,
      radiusKm,
    });
  }

  function resetSearch() {
    setQ('');
    setCity('Casablanca');
    setQuartier('');
    setService('Tous');
    setOpenOnly(false);
    setRadiusKm(10);
    setUserLocation(null);
    setApplied(DEFAULT_QUERY);
  }

  function selectSalon(id: string) {
    setSelectedId(id);
    document.getElementById(`salon-result-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCityChange(value: string) {
    setCity(value);
    if (userLocation) setUserLocation(null);
  }

  function handleNeighborhoodChange(value: string) {
    setQuartier(value);
    // Modifier manuellement le quartier annule le mode GPS précédent.
    if (userLocation) setUserLocation(null);
  }

  const resultLabel = useMemo(() => {
    if (loading) return 'Recherche des salons…';
    if (results.length === 0) return 'Aucun salon trouvé';
    return `${results.length} salon${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`;
  }, [loading, results.length]);

  const locationLabel = applied.latitude != null ? `Autour de ta position · ${applied.radiusKm} km` : `${applied.city || 'Maroc'}${applied.quartier ? ` · ${applied.quartier}` : ''}`;
  const mapMatches = useMemo(() => {
    const query = mapQuery.trim().toLowerCase();
    if (!query) return [];
    return results.filter((salon) => [salon.name, salon.barberName, salon.neighborhood, salon.address].some((value) => value.toLowerCase().includes(query))).slice(0, 6);
  }, [mapQuery, results]);

  return (
    <main className="salons-page">
      <div className="inner-head"><Header /></div>

      <section className="salons-command">
        <div className="container">
          <div className="salons-command-heading">
            <div>
              <span className="section-kicker">EXPLORER · MAROC</span>
              <h1>Le bon salon,<br /><em>près de toi.</em></h1>
              <p>Compare les vrais salons, leur disponibilité et leur statut en direct.</p>
            </div>
            <div className="salons-live-note"><i className="blink" /> Mise à jour automatique toutes les 45 secondes</div>
          </div>

          <form className="salons-search-form" onSubmit={submitSearch}>
            <label className="salons-search-field">
              <Search size={18} />
              <span><small>QUE CHERCHES-TU ?</small><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Salon, coiffeur ou coupe…" /></span>
              {q && <button type="button" aria-label="Effacer la recherche" onClick={() => setQ('')}><X size={15} /></button>}
            </label>
            <div className="salons-location-field">
              <LocationAutocomplete
                mode="city"
                value={city}
                onChange={handleCityChange}
                placeholder="Ville au Maroc"
              />
            </div>
            <div className="salons-location-field with-location">
              <LocationAutocomplete
                mode="neighborhood"
                value={quartier}
                onChange={handleNeighborhoodChange}
                placeholder="Quartier ou ma position"
                withGeolocation
                onPlace={(place) => {
                  if (place.lat != null && place.lng != null) setUserLocation({ lat: place.lat, lng: place.lng });
                }}
              />
            </div>
            <div className="salons-service-field">
              <span><small>SERVICE</small><CustomSelect className="salon-service-select" options={SERVICE_OPTIONS} value={service} onChange={setService} /></span>
            </div>
            <button className="salons-search-button" type="submit"><Search size={17} /> Rechercher</button>
          </form>

          <div className="salons-command-actions">
            <button className={openOnly ? 'quick-filter active' : 'quick-filter'} type="button" onClick={() => setOpenOnly((value) => {
              const next = !value;
              setApplied((current) => ({ ...current, openOnly: next }));
              return next;
            })}><i className={openOnly ? 'blink' : ''} /> Ouverts maintenant</button>
            <div className="radius-control"><Navigation size={14} /><span>Rayon</span><CustomSelect className="radius-select" options={RADIUS_OPTIONS} value={String(radiusKm)} disabled={!userLocation} onChange={(value) => {
              const next = Number(value);
              setRadiusKm(next);
              setApplied((current) => ({ ...current, radiusKm: next }));
            }} /></div>
            {userLocation && <span className="location-confirmed"><Check size={14} /> Position utilisée pour calculer les distances</span>}
            {(q || city !== 'Casablanca' || quartier || service !== 'Tous' || openOnly || userLocation) && <button className="clear-search" type="button" onClick={resetSearch}>Réinitialiser</button>}
          </div>
        </div>
      </section>

      <section className="container salons-explorer">
        <div className="salons-list-panel">
          <header className="salons-results-header">
            <div>
              <span className="section-kicker">RÉSULTATS EN DIRECT</span>
              <h2>{resultLabel}</h2>
              <p>{locationLabel} · créneaux et horaires recalculés maintenant</p>
            </div>
            <div className="salons-results-tools">
              {lastUpdated && <span className="last-updated"><RefreshCw size={13} /> {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              <button className="mobile-map-toggle" type="button" onClick={() => setMobileMap((value) => !value)}><ListFilter size={15} /> {mobileMap ? 'Voir la liste' : 'Voir la carte'}</button>
            </div>
          </header>

          {error && <div className="salons-error"><span>{error}</span><button type="button" onClick={() => void loadResults(applied)}><RefreshCw size={14} /> Réessayer</button></div>}

          {loading && results.length === 0 && <div className="salons-loading"><RefreshCw className="spin" /><span>On cherche les salons autour de toi…</span></div>}

          {!loading && results.length === 0 && (
            <div className="salons-empty"><MapPin /><h3>Aucun salon dans cette recherche</h3><p>Essaie un autre quartier, élargis le rayon ou enlève le filtre « ouverts maintenant ».</p><button type="button" onClick={resetSearch}>Afficher tous les salons</button></div>
          )}

          <div className="salon-results-list">
            {results.map((salon) => {
              const isSelected = selectedId === salon.id;
              const isFavorite = favorites.has(salon.id);
              const status = salon.openStatus;
              return (
                <article id={`salon-result-${salon.id}`} className={`salon-result-card${isSelected ? ' selected' : ''}`} key={salon.id} onMouseEnter={() => setSelectedId(salon.id)} onClick={(event) => {
                  if (!(event.target as HTMLElement).closest('a,button')) selectSalon(salon.id);
                }}>
                  <Link className="salon-result-photo" href={`/salons/${salon.slug}`} aria-label={`Voir ${salon.name}`}>
                    <Image src={salon.image} fill alt={salon.name} sizes="(max-width: 900px) 100vw, 300px" />
                    <span className={`salon-status ${status?.open ? 'open' : 'closed'}`}><i className={status?.open ? 'blink' : ''} /> {status?.open ? 'OUVERT' : 'FERMÉ'}</span>
                    {salon.verified && <em><Check size={12} /> Vérifié</em>}
                  </Link>
                  <div className="salon-result-body">
                    <div className="salon-result-topline">
                      <div>
                        <Link href={`/salons/${salon.slug}`}><h3>{salon.name}</h3></Link>
                        <p><MapPin size={14} /> {salon.neighborhood}, {salon.city}{salon.distanceKm != null ? ` · ${salon.distanceKm.toFixed(1)} km` : ''}</p>
                        <small className="salon-result-address">{salon.address}</small>
                      </div>
                      <button className={`favorite-button${isFavorite ? ' active' : ''}`} type="button" aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={() => toggleFavorite(salon.id)}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /></button>
                    </div>
                    <div className="salon-rating"><Star size={14} fill="currentColor" /> <b>{salon.rating.toFixed(1).replace('.', ',')}</b> <span>({salon.reviews} avis)</span></div>
                    <div className="salon-tags">{salon.services.slice(0, 3).map((item) => <span key={item.id}>{item.label}</span>)}</div>
                    <div className="salon-result-status"><Clock3 size={16} /><span><small>{status?.open ? status.label : status?.pause ? 'Pause du salon' : status?.label || 'Statut indisponible'}</small><b>{salon.nextSlot?.label || 'Prochaine disponibilité à venir'}</b></span><strong>Dès {salon.priceFrom} MAD</strong></div>
                    <div className="salon-result-actions"><Link href={`/salons/${salon.slug}`}><span>Voir la fiche</span><ChevronRight size={14} /></Link><a href={mapsHref(salon)} target="_blank" rel="noreferrer"><Navigation size={14} /> Itinéraire</a><Link className="primary" href={reservationHref(salon)}>Réserver</Link></div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className={`salons-map-panel${mobileMap ? ' mobile-visible' : ''}`}>
          <div className="salons-map-panel-head"><div><span className="section-kicker">CARTE EN DIRECT</span><h2>{results.length} adresse{results.length > 1 ? 's' : ''} affichée{results.length > 1 ? 's' : ''}</h2></div><span className="map-legend"><i className="open-dot" /> Ouvert</span></div>
          <div className="map-search-box">
            <Search size={16} />
            <input value={mapQuery} onChange={(event) => setMapQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && mapMatches[0]) { event.preventDefault(); selectSalon(mapMatches[0].id); setMapQuery(''); } }} placeholder="Chercher un salon sur la carte…" aria-label="Chercher un salon sur la carte" />
            {mapQuery && <button type="button" onClick={() => setMapQuery('')} aria-label="Effacer la recherche sur la carte"><X size={14} /></button>}
            {mapQuery && <div className="map-search-suggestions" role="listbox">
              {mapMatches.length ? mapMatches.map((salon) => <button type="button" role="option" key={salon.id} onClick={() => { selectSalon(salon.id); setMapQuery(''); }}><span><b>{salon.name}</b><small>{salon.neighborhood} · {salon.address}</small></span><ChevronRight size={14} /></button>) : <p>Aucun salon dans les résultats affichés.</p>}
            </div>}
          </div>
          <p className="map-interaction-hint">Choisis un résultat ou glisse la carte pour explorer les adresses.</p>
          <SalonMap salons={results} selectedId={selectedId} userLocation={userLocation} onSelect={selectSalon} />
          <div className="salons-map-footer"><span><MapPin size={14} /> Clique sur un pin pour passer d’un salon à l’autre · navigation limitée au Maroc.</span><a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Ouvrir Google Maps <ExternalLink size={12} /></a></div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
