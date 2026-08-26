import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/lib/api-guard';
import { normalizePhone } from '@/lib/auth-store';
import { createAppointment, listAppointmentsByBarber, listAppointmentsByClient } from '@/lib/platform-store';
import { BARBER_HOURS } from '@/lib/barbers';

const barbers: Record<string, { name: string; salon: string; neighborhood: string }> = {
  karim: { name: 'Karim B.', salon: 'Salon Mouad', neighborhood: 'Sidi Bernoussi' },
};

const serviceLabels: Record<string, string> = {
  'degrade-americain': 'Dégradé américain',
  'coupe-barbe': 'Coupe + barbe',
  'taper-fade': 'Taper fade',
  barbe: 'Taille de barbe',
  enfant: 'Coupe enfant',
  ciseaux: 'Coupe aux ciseaux',
};

const bodySchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  clientPhone: z.string().regex(/^\+?[0-9 ]{9,18}$/),
  clientName: z.string().max(120).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(5).max(480),
  priceMad: z.number().nonnegative(),
  clientNote: z.string().max(200).optional(),
});

function fmtHM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = url.searchParams.get('scope') || 'mine';
  const user = await requireSession();
  if (scope === 'barber') {
    if (!user || (user.role !== 'COIFFEUR' && user.role !== 'SUPER_ADMIN'))
      return NextResponse.json({ error: 'ACCES_REFUSE' }, { status: 403 });
    const barberId = url.searchParams.get('barberId') || 'karim';
    const date = url.searchParams.get('date') || undefined;
    return NextResponse.json({ data: { appointments: listAppointmentsByBarber(barberId, date) } });
  }
  // mine — require session
  if (!user) return NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 });
  const phone = url.searchParams.get('phone') || undefined;
  return NextResponse.json({
    data: {
      appointments:
        user.role === 'CLIENT' || user.role === 'SUPER_ADMIN'
          ? listAppointmentsByClient({ userId: user.sub })
          : listAppointmentsByClient({ phone }),
    },
  });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get('idempotency-key');
  if (!key) return NextResponse.json({ error: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 422 });
  const x = parsed.data;
  const barber = barbers[x.barberId] || { name: 'Coiffeur', salon: 'Salon', neighborhood: 'Casablanca' };
  const [h, m] = x.time.split(':').map(Number);

  // Respecte les horaires d'ouverture du coiffeur : pas de RDV en dehors
  // des heures d'ouverture (donc pas de message/RDV quand le salon est fermé).
  const target = new Date(x.date + 'T12:00:00');
  const dow = (target.getDay() + 6) % 7;
  const hours = BARBER_HOURS[x.barberId]?.[dow];
  const start = h * 60 + m;
  const end = start + x.durationMinutes;
  if (!hours || hours.closed || hours.open == null || hours.close == null) {
    return NextResponse.json(
      { error: 'SALON_FERME', message: 'Le salon est fermé ce jour-là. Choisis un autre jour.' },
      { status: 409 }
    );
  }
  if (start < hours.open || end > hours.close ||
      (hours.breakStart != null && hours.breakEnd != null && start < hours.breakEnd && end > hours.breakStart)) {
    return NextResponse.json(
      { error: 'HORS_HORAIRES', message: `Le coiffeur reçoit entre ${fmtHM(hours.open)} et ${fmtHM(hours.close)}.` },
      { status: 409 }
    );
  }

  const user = await requireSession();
  const normalizedClientPhone = normalizePhone(x.clientPhone);
  const result = createAppointment({
    barberId: x.barberId,
    barberName: barber.name,
    salonName: barber.salon,
    salonNeighborhood: barber.neighborhood,
    clientUserId: user?.sub || null,
    clientPhone: normalizedClientPhone,
    clientName: x.clientName || user?.name || null,
    date: x.date,
    startMinutes: h * 60 + m,
    endMinutes: h * 60 + m + x.durationMinutes,
    serviceId: x.serviceId,
    serviceLabel: serviceLabels[x.serviceId] || x.serviceId,
    priceMad: x.priceMad,
    note: x.clientNote,
    idempotencyKey: key,
  });
  if (result.clientConflict) {
    const conflict = result.clientConflict;
    return NextResponse.json(
      {
        error: 'CLIENT_TIME_CONFLICT',
        message: `Tu as déjà un rendez-vous à ${String(Math.floor(conflict.start_minutes / 60)).padStart(2, '0')}h${String(conflict.start_minutes % 60).padStart(2, '0')} chez ${conflict.salon_name}. Une seule réservation sur un créneau qui se chevauche est autorisée ; tu peux réserver plusieurs horaires différents.`,
        conflict: { reference: conflict.reference, salonName: conflict.salon_name, date: conflict.date },
      },
      { status: 409 }
    );
  }
  if (result.conflict) {
    return NextResponse.json(
      { error: 'SLOT_UNAVAILABLE', message: 'Ce créneau vient d’être réservé. Choisis une autre heure.' },
      { status: 409 }
    );
  }
  return NextResponse.json(
    { data: result.appointment, meta: { idempotencyReplay: result.replay } },
    { status: result.replay ? 200 : 201 }
  );
}
