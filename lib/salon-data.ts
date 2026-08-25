

// Horaires d'ouverture par plage (heures en minutes). Le coiffeur ne reçoit
// de messages / réservations que pendant ces plages. `closed` = jour de repos.
type HoursDay = { open?: number; close?: number; breakStart?: number; breakEnd?: number; closed?: boolean };
export type WeekHours = [HoursDay, HoursDay, HoursDay, HoursDay, HoursDay, HoursDay, HoursDay]; // Lun..Dim

export type Salon = {
  id: string;
  slug: string;
  name: string;
  barberName: string;
  neighborhood: string;
  city: string;
  address: string;
  gender: 'HOMME' | 'FEMME' | 'MIXTE';
  rating: number;
  reviews: number;
  priceFrom: number;
  verified: boolean;
  hours: WeekHours;
  services: { id: string; label: string; duration: number; price: number; gender: string }[];
  specialties: string[];
  nextSlot?: { date: string; time: string; label: string } | null;
  distanceKm?: number;
  image: string;
};

const H9_21: HoursDay = { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };
const H9_20: HoursDay = { open: 9 * 60, close: 20 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };
const H10_22: HoursDay = { open: 10 * 60, close: 22 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };
const CLOSED: HoursDay = { closed: true };

// État d'ouverture calculé à partir des horaires du salon.
export function getOpenStatus(hours: WeekHours, now = new Date()) {
  // JS: 0=Dimanche ... 6=Samedi → on veut 0=Lundi
  const day = (now.getDay() + 6) % 7;
  const tod = now.getHours() * 60 + now.getMinutes();
  const today = hours[day];
  if (today.closed || today.open == null || today.close == null) {
    // trouve le prochain jour d'ouverture
    const next = nextOpening(hours, now);
    return { open: false, nextChange: next, label: next ? `Ouvre ${next.label} à ${next.time}` : 'Fermé' };
  }
  if (tod < today.open) {
    return { open: false, nextChange: { day, time: fmtHM(today.open) }, label: `Ouvre aujourd'hui à ${fmtHM(today.open)}` };
  }
  if (today.breakStart != null && today.breakEnd != null && tod >= today.breakStart && tod < today.breakEnd) {
    return { open: false, pause: true, nextChange: { day, time: fmtHM(today.breakEnd) }, label: `Reprend à ${fmtHM(today.breakEnd)}` };
  }
  if (tod >= today.close) {
    const next = nextOpening(hours, now);
    return { open: false, nextChange: next, label: next ? `Ouvre ${next.label} à ${next.time}` : 'Fermé' };
  }
  return { open: true, until: fmtHM(today.close), label: `Ouvert jusqu'à ${fmtHM(today.close)}` };
}

function nextOpening(hours: WeekHours, now: Date) {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const day = (d.getDay() + 6) % 7;
    const h = hours[day];
    if (!h.closed && h.open != null) {
      const label = i === 1 ? "demain" : d.toLocaleDateString('fr-FR', { weekday: 'long' });
      return { day, time: fmtHM(h.open), label };
    }
  }
  return null;
}

function fmtHM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;
}

export const SALONS: Salon[] = [
  {
    id: 'salon-mouad', slug: 'mouad', name: 'Salon Mouad', barberName: 'Karim B.',
    neighborhood: 'Sidi Bernoussi', city: 'Casablanca', address: 'Av Moulay Ismail, Sidi Bernoussi',
    gender: 'HOMME', rating: 4.9, reviews: 214, priceFrom: 40, verified: true,
    image: '/images/salon-mouad-hero.jpg',
    hours: [H9_21, H9_21, H9_21, H9_21, H9_21, H10_22, CLOSED], // Lun..Dim
    specialties: ['Dégradé américain', 'Taper fade', 'Barbe au rasoir'],
    services: [
      { id: 'degrade-americain', label: 'Dégradé américain', duration: 40, price: 65, gender: 'HOMME' },
      { id: 'taper-fade', label: 'Taper fade', duration: 35, price: 60, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 25, price: 30, gender: 'HOMME' },
      { id: 'coupe-barbe', label: 'Coupe + barbe', duration: 55, price: 85, gender: 'HOMME' },
      { id: 'enfant', label: 'Coupe enfant', duration: 30, price: 40, gender: 'ENFANT' },
    ],
    distanceKm: 0.8,
  },
  {
    id: 'salon-nour', slug: 'salon-nour', name: 'Salon Nour', barberName: 'Ayoub Mansouri',
    neighborhood: 'Sidi Bernoussi', city: 'Casablanca', address: 'Rue 34, Sidi Bernoussi',
    gender: 'HOMME', rating: 4.7, reviews: 98, priceFrom: 35, verified: true,
    image: '/images/cut-fade.jpg',
    hours: [H9_20, H9_20, H9_20, H9_20, H9_20, H10_22, H10_22],
    specialties: ['Dégradé américain', 'Taper fade'],
    services: [
      { id: 'degrade-americain', label: 'Dégradé américain', duration: 40, price: 55, gender: 'HOMME' },
      { id: 'taper-fade', label: 'Taper fade', duration: 35, price: 50, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 20, price: 25, gender: 'HOMME' },
    ],
    distanceKm: 1.2,
  },
  {
    id: 'studio-hk', slug: 'studio-hk', name: 'Studio HK', barberName: 'Hamza K.',
    neighborhood: 'Sidi Moumen', city: 'Casablanca', address: 'Bd Alfadila, Sidi Moumen',
    gender: 'HOMME', rating: 4.6, reviews: 64, priceFrom: 30, verified: false,
    image: '/images/cut-curls.jpg',
    hours: [H10_22, H10_22, H10_22, H10_22, H10_22, CLOSED, CLOSED],
    specialties: ['Barbe au rasoir', 'Coupe enfant'],
    services: [
      { id: 'degrade-americain', label: 'Dégradé américain', duration: 40, price: 50, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 20, price: 25, gender: 'HOMME' },
      { id: 'enfant', label: 'Coupe enfant', duration: 30, price: 30, gender: 'ENFANT' },
    ],
    distanceKm: 2.4,
  },
  {
    id: 'barber-21', slug: 'barber-21', name: 'Barber 21', barberName: 'Othmane Idrissi',
    neighborhood: 'Aïn Sebaâ', city: 'Casablanca', address: 'Rue 21, Aïn Sebaâ',
    gender: 'MIXTE', rating: 4.8, reviews: 152, priceFrom: 45, verified: true,
    image: '/images/cut-beard.jpg',
    hours: [H9_21, H9_21, H9_21, CLOSED, H9_21, H10_22, H10_22],
    specialties: ['Ciseaux uniquement', 'Coloration homme'],
    services: [
      { id: 'ciseaux', label: 'Coupe aux ciseaux', duration: 45, price: 70, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 25, price: 35, gender: 'HOMME' },
    ],
    distanceKm: 3.1,
  },
];


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
