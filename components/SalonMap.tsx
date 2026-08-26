'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { ExternalLink, LocateFixed, MapPin, Minus, Plus, RotateCcw } from 'lucide-react';

type MapSalon = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  city: string;
  address?: string;
  latitude: number;
  longitude: number;
  openStatus?: { open: boolean; label: string };
};

type Position = { lat: number; lng: number };

type Props = {
  salons: MapSalon[];
  selectedId: string | null;
  userLocation?: Position | null;
  onSelect: (id: string) => void;
};

type MapProvider = 'loading' | 'google' | 'openstreetmap';
type View = { center: Position; zoom: number };
type MapSize = { width: number; height: number };

const TILE_SIZE = 256;
// Zone de navigation autorisée : la carte reste centrée sur le Maroc et ne
// permet pas de glisser vers l'Espagne, l'Algérie ou une vue monde.
const MOROCCO_BOUNDS = {
  north: 36.05,
  south: 27.4,
  west: -13.4,
  east: -1.0,
};
const MIN_ZOOM = 7;
const MAX_ZOOM = 18;

let googleMapsPromise: Promise<any> | null = null;

function loadGoogleMaps() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || typeof window === 'undefined') return Promise.reject(new Error('GOOGLE_MAPS_KEY_MISSING'));
  if ((window as any).google?.maps?.Map) return Promise.resolve((window as any).google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callback = `__hlaqtiMapReady_${Date.now()}`;
    (window as any)[callback] = () => resolve((window as any).google);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=fr&region=ma&callback=${callback}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('GOOGLE_MAPS_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function mapCenter(salons: MapSalon[], userLocation?: Position | null): Position {
  if (userLocation && isInMorocco(userLocation)) return userLocation;
  if (salons.length) return { lat: salons[0].latitude, lng: salons[0].longitude };
  // Casablanca centre : le fond OSM reste utile même si un filtre ne renvoie aucun salon.
  return { lat: 33.6148, lng: -7.5128 };
}

function isInMorocco(position: Position) {
  return position.lat >= MOROCCO_BOUNDS.south && position.lat <= MOROCCO_BOUNDS.north && position.lng >= MOROCCO_BOUNDS.west && position.lng <= MOROCCO_BOUNDS.east;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampAxis(value: number, min: number, max: number) {
  return min <= max ? clamp(value, min, max) : (min + max) / 2;
}

function worldSize(zoom: number) {
  return TILE_SIZE * 2 ** zoom;
}

// Projection Web Mercator : les pins et les tuiles utilisent exactement la
// même projection, donc ils restent collés à leur adresse pendant le déplacement.
function project(position: Position, zoom: number) {
  const size = worldSize(zoom);
  const lat = clamp(position.lat, -85.05112878, 85.05112878);
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((position.lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

function unproject(point: { x: number; y: number }, zoom: number): Position {
  const size = worldSize(zoom);
  const lng = (point.x / size) * 360 - 180;
  const y = 0.5 - point.y / size;
  const lat = (360 / Math.PI) * Math.atan(Math.exp(y * 2 * Math.PI)) - 90;
  return { lat: clamp(lat, -85.05112878, 85.05112878), lng };
}

function longitudeDelta(pointX: number, centerX: number, size: number) {
  let delta = pointX - centerX;
  if (delta > size / 2) delta -= size;
  if (delta < -size / 2) delta += size;
  return delta;
}

function clampMapCenter(position: Position, zoom: number, size: MapSize): Position {
  const centerPoint = project(position, zoom);
  const west = project({ lat: 0, lng: MOROCCO_BOUNDS.west }, zoom).x;
  const east = project({ lat: 0, lng: MOROCCO_BOUNDS.east }, zoom).x;
  const north = project({ lat: MOROCCO_BOUNDS.north, lng: 0 }, zoom).y;
  const south = project({ lat: MOROCCO_BOUNDS.south, lng: 0 }, zoom).y;
  const x = clampAxis(centerPoint.x, west + size.width / 2, east - size.width / 2);
  const y = clampAxis(centerPoint.y, north + size.height / 2, south - size.height / 2);
  return unproject({ x, y }, zoom);
}

function googleMarkerIcon(google: any, color: string, selected: boolean) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#fff8ef',
    strokeWeight: selected ? 4 : 2,
    scale: selected ? 10 : 8,
  };
}

function InteractiveOsmMap({ salons, selectedId, userLocation, onSelect, center }: Props & { center: Position }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null);
  const contextRef = useRef('');
  const [size, setSize] = useState<MapSize>({ width: 800, height: 625 });
  const [view, setView] = useState<View>({ center, zoom: salons.length === 1 ? 15 : 13 });
  const [dragging, setDragging] = useState(false);

  const contextKey = `${userLocation?.lat ?? ''},${userLocation?.lng ?? ''}|${salons.map((salon) => `${salon.id}:${salon.latitude}:${salon.longitude}`).join('|')}`;

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect?.width && rect?.height) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (contextRef.current === contextKey) return;
    contextRef.current = contextKey;
    const zoom = salons.length === 1 ? 15 : 13;
    setView({ center: clampMapCenter(center, zoom, size), zoom });
  }, [center, contextKey, salons.length, size]);

  useEffect(() => {
    const selected = salons.find((salon) => salon.id === selectedId);
    if (!selected) return;
    setView((current) => ({
      ...current,
      center: clampMapCenter({ lat: selected.latitude, lng: selected.longitude }, current.zoom, size),
    }));
  }, [selectedId, salons, size]);

  function changeZoom(delta: number) {
    setView((current) => {
      const zoom = clamp(current.zoom + delta, MIN_ZOOM, MAX_ZOOM);
      return { center: clampMapCenter(current.center, zoom, size), zoom };
    });
  }

  function resetView() {
    const zoom = salons.length === 1 ? 15 : 13;
    setView({ center: clampMapCenter(center, zoom, size), zoom });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    setView((current) => {
      const centerPoint = project(current.center, current.zoom);
      const nextCenter = unproject({ x: centerPoint.x - dx, y: centerPoint.y - dy }, current.zoom);
      return { ...current, center: clampMapCenter(nextCenter, current.zoom, size) };
    });
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      dragRef.current = null;
    }
    setDragging(false);
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 1 : -1);
  }

  const centerPoint = project(view.center, view.zoom);
  const topLeft = { x: centerPoint.x - size.width / 2, y: centerPoint.y - size.height / 2 };
  const firstTileX = Math.floor(topLeft.x / TILE_SIZE) - 1;
  const lastTileX = Math.floor((topLeft.x + size.width) / TILE_SIZE) + 1;
  const firstTileY = Math.floor(topLeft.y / TILE_SIZE) - 1;
  const lastTileY = Math.floor((topLeft.y + size.height) / TILE_SIZE) + 1;
  const tiles = [];
  const tileCount = 2 ** view.zoom;
  for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
    for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tileCount) continue;
      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({ tileX, tileY, wrappedX });
    }
  }

  function markerPosition(salon: MapSalon) {
    const point = project({ lat: salon.latitude, lng: salon.longitude }, view.zoom);
    return {
      left: size.width / 2 + longitudeDelta(point.x, centerPoint.x, worldSize(view.zoom)),
      top: size.height / 2 + point.y - centerPoint.y,
    };
  }

  const selected = salons.find((salon) => salon.id === selectedId);
  const selectedPosition = selected ? markerPosition(selected) : null;
  const userPosition = userLocation && isInMorocco(userLocation)
    ? markerPosition({ id: '__user__', name: 'Ta position', slug: '', neighborhood: '', city: '', latitude: userLocation.lat, longitude: userLocation.lng })
    : null;

  return (
    <div
      ref={mapRef}
      className={`osm-interactive-map${dragging ? ' dragging' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={() => changeZoom(1)}
      aria-label="Carte OpenStreetMap interactive des salons"
    >
      <div className="osm-tile-layer" style={{ left: -topLeft.x, top: -topLeft.y }}>
        {tiles.map((tile) => <img key={`${view.zoom}-${tile.tileX}-${tile.tileY}`} className="osm-tile" src={`https://tile.openstreetmap.org/${view.zoom}/${tile.wrappedX}/${tile.tileY}.png`} alt="" draggable={false} style={{ left: tile.tileX * TILE_SIZE, top: tile.tileY * TILE_SIZE }} />)}
      </div>

      <div className="osm-interactive-markers">
        {salons.map((salon) => {
          const position = markerPosition(salon);
          const selectedMarker = salon.id === selectedId;
          return <button key={salon.id} className={`osm-interactive-pin ${salon.openStatus?.open ? 'open' : 'closed'}${selectedMarker ? ' selected' : ''}`} style={{ left: position.left, top: position.top }} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); if (!dragRef.current?.moved) onSelect(salon.id); }} title={`${salon.name} · ${salon.openStatus?.label || 'Statut indisponible'}`} aria-label={`Sélectionner ${salon.name}`}><MapPin size={selectedMarker ? 30 : 25} fill="currentColor" /></button>;
        })}
        {userPosition && <span className="osm-interactive-user" style={{ left: userPosition.left, top: userPosition.top }} title="Ta position"><LocateFixed size={17} /></span>}
      </div>

      <div className="osm-map-controls" aria-label="Contrôles de carte">
        <button type="button" onClick={() => changeZoom(1)} aria-label="Zoomer"><Plus size={16} /></button>
        <button type="button" onClick={() => changeZoom(-1)} aria-label="Dézoomer"><Minus size={16} /></button>
        <button type="button" onClick={resetView} aria-label="Recentrer la carte"><RotateCcw size={15} /></button>
      </div>

      {selected && selectedPosition && <div className="osm-selected-card" style={{ left: clamp(selectedPosition.left, 120, size.width - 120), top: clamp(selectedPosition.top - 112, 14, size.height - 125) }}>
        <b>{selected.name}</b><small>{selected.address || selected.neighborhood} · {selected.openStatus?.open ? 'Ouvert' : 'Fermé'}</small><a href={`/salons/${selected.slug}`}>Voir la fiche <ExternalLink size={11} /></a>
      </div>}
      <div className="osm-interactive-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · glisse pour déplacer · molette pour zoomer</div>
    </div>
  );
}

export function SalonMap({ salons, selectedId, userLocation, onSelect }: Props) {
  const googleContainer = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const googleRef = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const [provider, setProvider] = useState<MapProvider>('loading');
  const center = useMemo(() => mapCenter(salons, userLocation), [salons, userLocation]);

  // On charge Google quand une clé est disponible. Le fond OSM interactif est
  // le vrai fallback : il ne dépend d'aucune clé et reste utilisable sur mobile.
  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then((google) => {
        if (!active) return;
        googleRef.current = google;
        setProvider('google');
      })
      .catch(() => {
        if (active) setProvider('openstreetmap');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (provider !== 'google' || !googleRef.current || !googleContainer.current || googleMap.current) return;
    const google = googleRef.current;
    googleMap.current = new google.maps.Map(googleContainer.current, {
      center,
      zoom: salons.length === 1 ? 15 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      minZoom: MIN_ZOOM,
      restriction: {
        latLngBounds: MOROCCO_BOUNDS,
        strictBounds: true,
      },
      clickableIcons: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#24211d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#c8bcae' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#24211d' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#494238' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#302b25' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#172d32' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#302b25' }] },
      ],
    });
  }, [center, provider, salons.length]);

  useEffect(() => {
    const google = googleRef.current;
    const map = googleMap.current;
    if (!google || !map || provider !== 'google') return;

    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = salons.map((salon) => {
      const isSelected = salon.id === selectedId;
      const marker = new google.maps.Marker({
        map,
        position: { lat: salon.latitude, lng: salon.longitude },
        title: `${salon.name} · ${salon.openStatus?.open ? 'Ouvert' : 'Fermé'}`,
        icon: googleMarkerIcon(google, salon.openStatus?.open ? '#2e9e6b' : '#9c8d79', isSelected),
        zIndex: isSelected ? 20 : 5,
      });
      marker.addListener('click', () => onSelect(salon.id));
      return marker;
    });

    if (userLocation) {
      userMarker.current?.setMap(null);
      userMarker.current = new google.maps.Marker({
        map,
        position: userLocation,
        title: 'Ta position',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b7ea1',
          fillOpacity: 1,
          strokeColor: '#f5f1ea',
          strokeWeight: 3,
          scale: 8,
        },
        zIndex: 30,
      });
    } else {
      userMarker.current?.setMap(null);
      userMarker.current = null;
    }

    if (selectedId) {
      const selected = salons.find((salon) => salon.id === selectedId);
      if (selected) map.panTo({ lat: selected.latitude, lng: selected.longitude });
    } else if (salons.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      salons.forEach((salon) => bounds.extend({ lat: salon.latitude, lng: salon.longitude }));
      map.fitBounds(bounds, 70);
    } else {
      map.panTo(center);
    }
  }, [salons, selectedId, userLocation, provider, center, onSelect]);

  return (
    <div className="salon-map-widget">
      {provider === 'google' && <div ref={googleContainer} className="real-google-map" aria-label="Carte Google Maps des salons" />}
      {provider === 'loading' && <div className="map-loading"><LocateFixed className="spin" /><span>Chargement de la carte…</span></div>}
      {provider === 'openstreetmap' && <InteractiveOsmMap salons={salons} selectedId={selectedId} userLocation={userLocation} onSelect={onSelect} center={center} />}
      <div className="map-provider-badge">{provider === 'google' ? 'Google Maps · Maroc uniquement' : 'Carte réelle OpenStreetMap · Maroc'} <span>·</span> {salons.length} point{salons.length > 1 ? 's' : ''}</div>
      {provider === 'openstreetmap' && <a className="map-expand-link" href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=13/${center.lat}/${center.lng}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Ouvrir en grand</a>}
    </div>
  );
}
