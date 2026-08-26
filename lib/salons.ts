import { generateSlots } from './booking';
import { listBookedSlots } from './platform-store';
import { getOpenStatus, SALONS as STATIC_SALONS, type Salon } from './salon-data';

export type { Salon };
export { getOpenStatus, type WeekHours } from './salon-data';

const BARBER_MAP: Record<string, string> = {
  'salon-mouad': 'karim',
  'salon-nour': 'karim',
  'studio-hk': 'karim',
  'barber-21': 'karim',
};

// Le prochain créneau est recalculé à chaque requête API. Ainsi une carte
// laissée ouverte ne continue pas d'afficher un créneau devenu obsolète.
function liveSalons(): Salon[] {
  return STATIC_SALONS.map((salon) => ({
    ...salon,
    nextSlot: nextSlotFor(BARBER_MAP[salon.id] || salon.id, salon.hours),
  }));
}

export const SALONS: Salon[] = liveSalons();

export function searchSalons(filters: {
  q?: string;
  city?: string;
  quartier?: string;
  service?: string;
  priceMax?: number;
  verified?: boolean;
  sort?: string;
  date?: string;
  openNow?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}) {
  let out = liveSalons();

  if (filters.city && filters.city.toLowerCase() !== 'tous') {
    const city = filters.city.toLowerCase();
    out = out.filter((salon) => salon.city.toLowerCase() === city || slugify(salon.city) === city);
  }
  if (filters.quartier && filters.quartier.toLowerCase() !== 'tous') {
    const quartier = filters.quartier.toLowerCase();
    out = out.filter((salon) => salon.neighborhood.toLowerCase() === quartier || slugify(salon.neighborhood) === quartier);
  }
  if (filters.service && filters.service.toLowerCase() !== 'tous') {
    const service = filters.service.toLowerCase();
    out = out.filter((salon) => salon.services.some((item) => item.id.toLowerCase() === service || slugify(item.label) === service));
  }
  if (filters.q) {
    const query = filters.q.toLowerCase();
    out = out.filter((salon) =>
      salon.name.toLowerCase().includes(query) ||
      salon.barberName.toLowerCase().includes(query) ||
      salon.address.toLowerCase().includes(query) ||
      salon.city.toLowerCase().includes(query) ||
      salon.neighborhood.toLowerCase().includes(query) ||
      salon.specialties.some((specialty) => specialty.toLowerCase().includes(query))
    );
  }
  if (filters.verified) out = out.filter((salon) => salon.verified);
  if (filters.priceMax) out = out.filter((salon) => salon.priceFrom <= filters.priceMax!);

  // Si le navigateur a fourni une position, les distances sont réellement
  // calculées sur les coordonnées enregistrées du salon, puis triées/filtrées.
  if (Number.isFinite(filters.latitude) && Number.isFinite(filters.longitude)) {
    out = out
      .map((salon) => ({
        ...salon,
        distanceKm: Number(distanceKm(filters.latitude!, filters.longitude!, salon.latitude, salon.longitude).toFixed(1)),
      }))
      .filter((salon) => salon.distanceKm! <= (filters.radiusKm || 10));
  }

  if (filters.openNow) {
    // « Ouvert maintenant » doit suivre l'horloge du Maroc, pas seulement
    // l'existence d'un créneau plus tard dans la journée.
    out = out.filter((salon) => getOpenStatus(salon.hours).open);
  }

  switch (filters.sort) {
    case 'note':
      out.sort((a, b) => b.rating - a.rating);
      break;
    case 'distance':
      out.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
      break;
    case 'disponibilite':
    default:
      out.sort((a, b) =>
        (a.nextSlot?.date || '9999').localeCompare(b.nextSlot?.date || '9999') ||
        (a.nextSlot?.time || '').localeCompare(b.nextSlot?.time || '')
      );
  }

  return out;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const QUARTIERS = ['Tous', ...Array.from(new Set(STATIC_SALONS.map((salon) => salon.neighborhood)))];
export const SERVICES = [
  { id: 'Tous', label: 'Tous services' },
  ...Array.from(
    new Map(STATIC_SALONS.flatMap((salon) => salon.services).map((service) => [service.id, service])).values()
  ).map((service) => ({ id: service.id, label: service.label })),
];

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Les heures affichées par HLAQTI sont celles du Maroc, quelle que soit la
// timezone du serveur qui exécute Next.js.
function moroccoClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  const year = get('year');
  const month = get('month');
  const dayOfMonth = get('day');
  const date = new Date(year, month - 1, dayOfMonth, 12, 0, 0);
  return {
    iso: `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`,
    minutes: get('hour') * 60 + get('minute'),
    day: (date.getDay() + 6) % 7,
    date,
  };
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function nextSlotFor(barberId: string, hours: import('./salon-data').WeekHours, duration = 40) {
  const clock = moroccoClock();
  for (let offset = 0; offset < 14; offset++) {
    const date = new Date(clock.date);
    date.setDate(clock.date.getDate() + offset);
    const iso = isoDate(date);
    const day = (date.getDay() + 6) % 7;
    const todayHours = hours[day];
    if (todayHours.closed || todayHours.open == null || todayHours.close == null) continue;

    const working = [{ startMinutes: todayHours.open, endMinutes: todayHours.close }];
    const breaks = todayHours.breakStart != null && todayHours.breakEnd != null
      ? [{ startMinutes: todayHours.breakStart, endMinutes: todayHours.breakEnd }]
      : [];
    const booked = listBookedSlots(barberId, iso).map((slot) => ({ startMinutes: slot.start, endMinutes: slot.end }));
    const minStart = offset === 0 ? clock.minutes : 0;
    const slots = generateSlots({
      working,
      breaks,
      booked,
      durationMinutes: duration,
      gridMinutes: 15,
      bufferMinutes: 5,
      minStartMinutes: minStart,
    }).filter((slot) => slot.available);

    if (slots.length) {
      const slot = slots[0];
      const label = offset === 0
        ? "Aujourd'hui"
        : offset === 1
          ? 'Demain'
          : date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      return { date: iso, time: slot.time, label: `${label} à ${slot.time.replace(':', ' h ')}` };
    }
  }
  return null;
}
