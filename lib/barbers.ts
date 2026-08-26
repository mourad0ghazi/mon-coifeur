import type { WeekHours } from './salons';

// Horaires d'ouverture par coiffeur (base de démonstration).
// En production, ces horaires sont éditables par le coiffeur dans /pro/horaires.
export const BARBER_HOURS: Record<string, WeekHours> = {
  karim: [
    { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 }, // Lun
    { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 }, // Mar
    { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 }, // Mer
    { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 }, // Jeu
    { open: 9 * 60, close: 21 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 }, // Ven
    { open: 10 * 60, close: 22 * 60, breakStart: 13 * 60, breakEnd: 14 * 60 }, // Sam
    { closed: true }, // Dim
  ],
};

export type OpenStatus = {
  open: boolean;
  pause?: boolean;
  label: string;
  until?: string;
  nextChange?: { time: string; label: string } | null;
  messagingOpen: boolean;
};

function fmtHM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;
}

export function getBarberStatus(barberId: string, now = new Date()): OpenStatus {
  const hours = BARBER_HOURS[barberId];
  if (!hours) {
    return { open: true, label: 'Ouvert', messagingOpen: true };
  }
  const day = (now.getDay() + 6) % 7;
  const tod = now.getHours() * 60 + now.getMinutes();
  const h = hours[day];

  if (h.closed || h.open == null || h.close == null) {
    const next = nextOpening(hours, now);
    return { open: false, label: next ? `Fermé · ouvre ${next.label} à ${next.time}` : 'Fermé', nextChange: next, messagingOpen: false };
  }
  if (tod < h.open) {
    return { open: false, label: `Fermé · ouvre à ${fmtHM(h.open)}`, nextChange: { time: fmtHM(h.open), label: "aujourd'hui" }, messagingOpen: false };
  }
  if (h.breakStart != null && h.breakEnd != null && tod >= h.breakStart && tod < h.breakEnd) {
    return { open: false, pause: true, label: `Pause · reprend à ${fmtHM(h.breakEnd)}`, nextChange: { time: fmtHM(h.breakEnd), label: "aujourd'hui" }, messagingOpen: false };
  }
  if (tod >= h.close) {
    const next = nextOpening(hours, now);
    return { open: false, label: next ? `Fermé · ouvre ${next.label} à ${next.time}` : 'Fermé', nextChange: next, messagingOpen: false };
  }
  return { open: true, until: fmtHM(h.close), label: `Ouvert jusqu'à ${fmtHM(h.close)}`, messagingOpen: true };
}

function nextOpening(hours: WeekHours, now: Date) {
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    const day = (d.getDay() + 6) % 7;
    const h = hours[day];
    if (!h.closed && h.open != null) {
      const label = i === 1 ? 'demain' : d.toLocaleDateString('fr-FR', { weekday: 'long' });
      return { day, time: fmtHM(h.open), label };
    }
  }
  return null;
}
