import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/api-guard';
import { cancelAppointment } from '@/lib/platform-store';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  if (!user) return NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 });
  const { id } = await params;
  const by = user.role === 'COIFFEUR' || user.role === 'SUPER_ADMIN' ? 'COIFFEUR' : 'CLIENT';
  const result = cancelAppointment(id, by);
  if (!result.ok) {
    const status = result.error === 'TROP_TARD' ? 409 : 400;
    return NextResponse.json(
      {
        error: result.error,
        message:
          result.error === 'TROP_TARD'
            ? 'Annulation impossible : moins de 2 heures avant le rendez-vous.'
            : 'Annulation impossible.',
      },
      { status }
    );
  }
  return NextResponse.json({ data: { appointment: result.appointment } });
}
