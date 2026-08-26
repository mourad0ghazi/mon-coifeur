

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
  latitude: number;
  longitude: number;
  whatsapp?: string;
  image: string;
};

const H9_21: HoursDay = { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };
const H9_20: HoursDay = { open: 9 * 60, close: 20 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };
const H10_22: HoursDay = { open: 10 * 60, close: 22 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 };
const CLOSED: HoursDay = { closed: true };

// État d'ouverture calculé à partir des horaires du salon.
export function getOpenStatus(hours: WeekHours, now = new Date()) {
  // Toujours utiliser l'heure locale du Maroc, même si le serveur est en UTC.
  const clock = moroccoClock(now);
  const day = clock.day;
  const tod = clock.minutes;
  const today = hours[day];
  if (today.closed || today.open == null || today.close == null) {
    // trouve le prochain jour d'ouverture
    const next = nextOpening(hours, clock.date);
    return { open: false, nextChange: next, label: next ? `Ouvre ${next.label} à ${next.time}` : 'Fermé' };
  }
  if (tod < today.open) {
    return { open: false, nextChange: { day, time: fmtHM(today.open) }, label: `Ouvre aujourd'hui à ${fmtHM(today.open)}` };
  }
  if (today.breakStart != null && today.breakEnd != null && tod >= today.breakStart && tod < today.breakEnd) {
    return { open: false, pause: true, nextChange: { day, time: fmtHM(today.breakEnd) }, label: `Reprend à ${fmtHM(today.breakEnd)}` };
  }
  if (tod >= today.close) {
    const next = nextOpening(hours, clock.date);
    return { open: false, nextChange: next, label: next ? `Ouvre ${next.label} à ${next.time}` : 'Fermé' };
  }
  return { open: true, until: fmtHM(today.close), label: `Ouvert jusqu'à ${fmtHM(today.close)}` };
}

function moroccoClock(now: Date) {
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
    minutes: (get('hour') % 24) * 60 + get('minute'),
    day: (date.getDay() + 6) % 7,
    date,
  };
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
    latitude: 33.6167,
    longitude: -7.5011,
    whatsapp: '+212611111111',
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
    latitude: 33.6141,
    longitude: -7.4938,
    whatsapp: '+212622222222',
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
    latitude: 33.6088,
    longitude: -7.5329,
    whatsapp: '+212622222222',
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
    latitude: 33.6035,
    longitude: -7.5262,
    whatsapp: '+212633333333',
  },
  {
    id: 'atelier-bernoussi', slug: 'atelier-bernoussi', name: 'Atelier Bernoussi', barberName: 'Soufiane R.',
    neighborhood: 'Sidi Bernoussi', city: 'Casablanca', address: 'Rue Ibn Sina, Sidi Bernoussi',
    gender: 'HOMME', rating: 4.8, reviews: 76, priceFrom: 35, verified: true,
    image: '/images/hero-fade.jpg',
    hours: [H9_21, H9_21, H9_21, H9_21, H9_21, H10_22, H10_22],
    specialties: ['Low fade', 'Contours premium', 'Barbe'],
    services: [
      { id: 'degrade-americain', label: 'Dégradé américain', duration: 40, price: 60, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 25, price: 30, gender: 'HOMME' },
    ],
    distanceKm: 1.5,
    latitude: 33.6212,
    longitude: -7.4932,
    whatsapp: '+212644444444',
  },
  {
    id: 'corner-zenata', slug: 'corner-zenata', name: 'Corner Zenata', barberName: 'Mehdi A.',
    neighborhood: 'Zenata', city: 'Casablanca', address: 'Route côtière, Zenata',
    gender: 'MIXTE', rating: 4.6, reviews: 51, priceFrom: 40, verified: true,
    image: '/images/hero-salon.jpg',
    hours: [H10_22, H10_22, H10_22, H10_22, H10_22, H10_22, CLOSED],
    specialties: ['Coupe moderne', 'Coupe enfant', 'Brushing'],
    services: [
      { id: 'taper-fade', label: 'Taper fade', duration: 35, price: 55, gender: 'HOMME' },
      { id: 'enfant', label: 'Coupe enfant', duration: 30, price: 40, gender: 'ENFANT' },
    ],
    distanceKm: 4.8,
    latitude: 33.6259,
    longitude: -7.4448,
    whatsapp: '+212655443322',
  },
  {
    id: 'moulay-clippers', slug: 'moulay-clippers', name: 'Moulay Clippers', barberName: 'Rachid M.',
    neighborhood: 'Sidi Moumen', city: 'Casablanca', address: 'Bd Moulay Rachid, Sidi Moumen',
    gender: 'HOMME', rating: 4.5, reviews: 43, priceFrom: 30, verified: false,
    image: '/images/cut-fade-2.jpg',
    hours: [H9_20, H9_20, H9_20, H9_20, H9_20, H10_22, CLOSED],
    specialties: ['Taper fade', 'Barbe au rasoir'],
    services: [
      { id: 'taper-fade', label: 'Taper fade', duration: 35, price: 45, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 20, price: 25, gender: 'HOMME' },
    ],
    distanceKm: 2.9,
    latitude: 33.6101,
    longitude: -7.5416,
    whatsapp: '+212677889900',
  },
  {
    id: 'hay-mohammadi-studio', slug: 'hay-mohammadi-studio', name: 'Hay Mohammadi Studio', barberName: 'Nabil E.',
    neighborhood: 'Hay Mohammadi', city: 'Casablanca', address: 'Av. 10 Mars, Hay Mohammadi',
    gender: 'MIXTE', rating: 4.7, reviews: 89, priceFrom: 45, verified: true,
    image: '/images/hero-beard.jpg',
    hours: [H9_21, H9_21, H9_21, H9_21, H9_21, H10_22, H10_22],
    specialties: ['Barbe premium', 'Coupe aux ciseaux', 'Coloration'],
    services: [
      { id: 'ciseaux', label: 'Coupe aux ciseaux', duration: 45, price: 70, gender: 'HOMME' },
      { id: 'barbe', label: 'Barbe premium', duration: 30, price: 40, gender: 'HOMME' },
    ],
    distanceKm: 5.2,
    latitude: 33.5847,
    longitude: -7.5678,
    whatsapp: '+212688990011',
  },
  {
    id: 'ahl-loghlam-barber', slug: 'ahl-loghlam-barber', name: 'Ahl Loghlam Barber', barberName: 'Yassine T.',
    neighborhood: 'Ahl Loghlam', city: 'Casablanca', address: 'Rue Al Qods, Ahl Loghlam',
    gender: 'HOMME', rating: 4.4, reviews: 38, priceFrom: 25, verified: false,
    image: '/images/hero-design.jpg',
    hours: [H9_20, H9_20, H9_20, CLOSED, H9_20, H10_22, H10_22],
    specialties: ['Dégradé', 'Coupe enfant', 'Design hair'],
    services: [
      { id: 'degrade-americain', label: 'Dégradé américain', duration: 40, price: 45, gender: 'HOMME' },
      { id: 'enfant', label: 'Coupe enfant', duration: 30, price: 30, gender: 'ENFANT' },
    ],
    distanceKm: 6.4,
    latitude: 33.5744,
    longitude: -7.5088,
    whatsapp: '+212699001122',
  },
  {
    id: 'maarif-cut-house', slug: 'maarif-cut-house', name: 'Maârif Cut House', barberName: 'Adam B.',
    neighborhood: 'Maârif', city: 'Casablanca', address: 'Rue Socrate, Maârif',
    gender: 'MIXTE', rating: 4.9, reviews: 173, priceFrom: 60, verified: true,
    image: '/images/cut-taper-2.jpg',
    hours: [H9_21, H9_21, H9_21, H9_21, H9_21, H10_22, H10_22],
    specialties: ['Taper premium', 'Coupe femme', 'Barbe sculptée'],
    services: [
      { id: 'taper-fade', label: 'Taper premium', duration: 40, price: 75, gender: 'HOMME' },
      { id: 'coupe-barbe', label: 'Coupe + barbe', duration: 55, price: 105, gender: 'HOMME' },
    ],
    distanceKm: 8.6,
    latitude: 33.5845,
    longitude: -7.6322,
    whatsapp: '+212611223344',
  },
  {
    id: 'oasis-grooming', slug: 'oasis-grooming', name: 'Oasis Grooming', barberName: 'Ilyas K.',
    neighborhood: 'Oasis', city: 'Casablanca', address: 'Bd Ghandi, Oasis',
    gender: 'MIXTE', rating: 4.8, reviews: 112, priceFrom: 55, verified: true,
    image: '/images/cut-beard-2.jpg',
    hours: [H9_21, H9_21, H9_21, H9_21, H9_21, H10_22, CLOSED],
    specialties: ['Barbe sculptée', 'Coupe classique', 'Soin visage'],
    services: [
      { id: 'barbe', label: 'Barbe sculptée', duration: 30, price: 45, gender: 'HOMME' },
      { id: 'ciseaux', label: 'Coupe classique', duration: 45, price: 65, gender: 'HOMME' },
    ],
    distanceKm: 9.2,
    latitude: 33.5564,
    longitude: -7.6387,
    whatsapp: '+212622334455',
  },
  {
    id: 'bourgogne-barber', slug: 'bourgogne-barber', name: 'Bourgogne Barber', barberName: 'Omar L.',
    neighborhood: 'Bourgogne', city: 'Casablanca', address: 'Rue Ibnou Nafis, Bourgogne',
    gender: 'HOMME', rating: 4.6, reviews: 67, priceFrom: 50, verified: true,
    image: '/images/cut-beard.jpg',
    hours: [H10_22, H10_22, H10_22, H10_22, H10_22, H10_22, H10_22],
    specialties: ['Barbe', 'Taper fade', 'Soin serviette chaude'],
    services: [
      { id: 'taper-fade', label: 'Taper fade', duration: 35, price: 65, gender: 'HOMME' },
      { id: 'barbe', label: 'Taille de barbe', duration: 25, price: 35, gender: 'HOMME' },
    ],
    distanceKm: 9.8,
    latitude: 33.5968,
    longitude: -7.6481,
    whatsapp: '+212633445566',
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
        s.address.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.neighborhood.toLowerCase().includes(q) ||
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
