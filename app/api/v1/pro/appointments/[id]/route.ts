import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePro } from '@/lib/api-guard';
import { listAppointmentsForCoiffeur, setAppointmentStatus, writeAudit } from '@/lib/platform-store';

const schema = z.object({
  status: z.enum(['CONFIRME', 'EN_COURS', 'TERMINE', 'NO_SHOW', 'ANNULE_COIFFEUR']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requirePro();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'STATUT_INVALIDE' }, { status: 422 });

  const mine = listAppointmentsForCoiffeur(guard.user.sub);
  if (!mine.some((a) => a.id === id)) {
    return NextResponse.json({ error: 'NON_AUTORISE' }, { status: 403 });
  }
  const appointment = setAppointmentStatus(id, parsed.data.status);
  writeAudit({
    actorId: guard.user.sub,
    actorName: guard.user.name,
    action: 'APPOINTMENT_STATUS_CHANGED',
    target: appointment?.reference,
    meta: { status: parsed.data.status },
  });
  return NextResponse.json({ data: { appointment } });
}
