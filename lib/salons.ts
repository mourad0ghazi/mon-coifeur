import { generateSlots } from './booking';
import { listBookedSlots } from './platform-store';
import { SALONS as STATIC_SALONS, type Salon } from './salon-data';

export type { Salon };
export { getOpenStatus, type WeekHours } from './salon-data';

export const SALONS: Salon[] = STATIC_SALONS.map((s) => ({ ...s }));

const BARBER_MAP: Record<string, string> = {
  'salon-mouad': 'karim','salon-nour':'karim','studio-hk':'karim','barber-21':'karim',
};
// Calcule le prochain créneau réel de chaque salon selon SES horaires.
for (const s of SALONS) {
  s.nextSlot = nextSlotFor(BARBER_MAP[s.id] || s.id, s.hours);
}

export function searchSalons(filters: {
  q?: string; city?: string; quartier?: string; service?: string;
  priceMax?: number; verified?: boolean; sort?: string; date?: string; openNow?: boolean;
}) {
  let out = [...SALONS];
  if (filters.city && filters.city.toLowerCase() !== 'tous') {
    const c = filters.city.toLowerCase();
    out = out.filter((s) => s.city.toLowerCase() === c || slugify(s.city) === c);
  }
  if (filters.quartier && filters.quartier !== 'Tous') {
    const q = filters.quartier.toLowerCase();
    out = out.filter((s) => s.neighborhood.toLowerCase() === q || slugify(s.neighborhood) === q);
  }
  if (filters.service && filters.service !== 'Tous') {
    const q = filters.service.toLowerCase();
    out = out.filter((s) => s.services.some((sv) => sv.id.toLowerCase() === q || slugify(sv.label) === q));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.barberName.toLowerCase().includes(q) ||
        s.specialties.some((x) => x.toLowerCase().includes(q))
    );
  }
  if (filters.verified) out = out.filter((s) => s.verified);
  if (filters.priceMax) out = out.filter((s) => s.priceFrom <= filters.priceMax!);
  if (filters.openNow) {
    const today = new Date().toISOString().slice(0, 10);
    out = out.filter((s) => s.nextSlot && s.nextSlot.date === today);
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
      out.sort((a, b) => (a.nextSlot?.date || '9999').localeCompare(b.nextSlot?.date || '9999') || (a.nextSlot?.time || '').localeCompare(b.nextSlot?.time || ''));
  }
  return out;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const QUARTIERS = ['Tous', ...Array.from(new Set(SALONS.map((s) => s.neighborhood)))];
export const SERVICES = [
  { id: 'Tous', label: 'Tous services' },
  ...Array.from(
    new Map(SALONS.flatMap((s) => s.services).map((sv) => [sv.id, sv])).values()
  ).map((sv) => ({ id: sv.id, label: sv.label })),
];

// ---------- Server-only helpers (don't import this file from client components;
// use ./salon-data for the static list). ----------
function currentMinutes() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }

export function nextSlotFor(barberId: string, hours: import('./salon-data').WeekHours, duration = 40) {
  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(); d.setDate(d.getDate() + offset);
    const iso = d.toISOString().slice(0, 10);
    const day = (d.getDay() + 6) % 7;
    const h = hours[day];
    if (h.closed || h.open == null || h.close == null) continue;
    const working = [{ startMinutes: h.open, endMinutes: h.close }];
    const breaks = h.breakStart != null && h.breakEnd != null
      ? [{ startMinutes: h.breakStart, endMinutes: h.breakEnd }] : [];
    const booked = listBookedSlots(barberId, iso).map((b) => ({ startMinutes: b.start, endMinutes: b.end }));
    const minStart = offset === 0 ? currentMinutes() : 0;
    const slots = generateSlots({ working, breaks, booked, durationMinutes: duration, gridMinutes: 15, bufferMinutes: 5, minStartMinutes: minStart }).filter((s) => s.available);
    if (slots.length) {
      const s = slots[0];
      const label = offset === 0 ? "Aujourd'hui" : offset === 1 ? 'Demain' : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      return { date: iso, time: s.time, label: `${label} à ${s.time.replace(':', ' h ')}` };
    }
  }
  return null;
}
