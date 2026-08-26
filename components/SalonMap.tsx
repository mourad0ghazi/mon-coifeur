'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, LocateFixed, MapPin } from 'lucide-react';

type MapSalon = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  city: string;
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
  if (userLocation) return userLocation;
  if (salons.length) return { lat: salons[0].latitude, lng: salons[0].longitude };
  // Casablanca centre : le fond OSM reste utile même si un filtre ne renvoie aucun salon.
  return { lat: 33.6148, lng: -7.5128 };
}

function bboxFor(center: Position) {
  // Une emprise assez large pour voir les quartiers nord de Casablanca.
  const latDelta = 0.055;
  const lngDelta = 0.085;
  return {
    west: center.lng - lngDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    north: center.lat + latDelta,
  };
}

function pinPosition(salon: MapSalon, bbox: ReturnType<typeof bboxFor>) {
  const left = ((salon.longitude - bbox.west) / (bbox.east - bbox.west)) * 100;
  const top = ((bbox.north - salon.latitude) / (bbox.north - bbox.south)) * 100;
  return { left: `${left}%`, top: `${top}%` };
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

export function SalonMap({ salons, selectedId, userLocation, onSelect }: Props) {
  const googleContainer = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const googleRef = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const [provider, setProvider] = useState<MapProvider>('loading');
  const center = useMemo(() => mapCenter(salons, userLocation), [salons, userLocation]);
  const bbox = useMemo(() => bboxFor(center), [center]);

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then((google) => {
        if (!active || !googleContainer.current) return;
        googleRef.current = google;
        googleMap.current = new google.maps.Map(googleContainer.current, {
          center,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
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
        setProvider('google');
      })
      .catch(() => {
        if (active) setProvider('openstreetmap');
      });

    return () => {
      active = false;
      markers.current.forEach((marker) => marker.setMap(null));
      userMarker.current?.setMap(null);
      markers.current = [];
      googleMap.current = null;
    };
    // The map is initialized once. Marker and centre updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const osmSrc = useMemo(() => {
    const values = [bbox.west, bbox.south, bbox.east, bbox.north].map((value) => value.toFixed(6)).join('%2C');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${values}&layer=mapnik&marker=${center.lat.toFixed(6)}%2C${center.lng.toFixed(6)}`;
  }, [bbox, center]);

  return (
    <div className="salon-map-widget">
      {provider === 'google' && <div ref={googleContainer} className="real-google-map" aria-label="Carte Google Maps des salons" />}
      {provider === 'loading' && <div className="map-loading"><LocateFixed className="spin" /><span>Chargement de la carte…</span></div>}
      {provider === 'openstreetmap' && (
        <div className="osm-map-wrap">
          <iframe title="Carte réelle des salons HLAQTI" src={osmSrc} loading="lazy" />
          <div className="osm-markers" aria-label="Salons sur la carte">
            {salons.map((salon) => {
              const position = pinPosition(salon, bbox);
              const selected = salon.id === selectedId;
              return <button key={salon.id} className={`osm-pin ${salon.openStatus?.open ? 'open' : 'closed'}${selected ? ' selected' : ''}`} style={position} onClick={() => onSelect(salon.id)} title={`${salon.name} · ${salon.openStatus?.label || 'Statut indisponible'}`} aria-label={`Afficher ${salon.name}`}><MapPin size={selected ? 24 : 21} fill="currentColor" /></button>;
            })}
            {userLocation && <span className="osm-user-pin" style={{ left: `${((userLocation.lng - bbox.west) / (bbox.east - bbox.west)) * 100}%`, top: `${((bbox.north - userLocation.lat) / (bbox.north - bbox.south)) * 100}%` }} title="Ta position"><LocateFixed size={19} /></span>}
          </div>
        </div>
      )}
      <div className="map-provider-badge">{provider === 'google' ? 'Google Maps · Maroc' : 'Carte réelle OpenStreetMap'} <span>·</span> {salons.length} point{salons.length > 1 ? 's' : ''}</div>
      {provider === 'openstreetmap' && <a className="map-expand-link" href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=13/${center.lat}/${center.lng}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /> Agrandir la carte</a>}
    </div>
  );
}
