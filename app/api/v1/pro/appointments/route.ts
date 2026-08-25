import { NextResponse } from 'next/server';
import { requirePro } from '@/lib/api-guard';
import { listAppointmentsForCoiffeur } from '@/lib/platform-store';

export async function GET(req: Request) {
  const guard = await requirePro();
  if ('error' in guard) return guard.error;
  const url = new URL(req.url);
  const date = url.searchParams.get('date') || undefined;
  const appointments = listAppointmentsForCoiffeur(guard.user.sub, date);
  return NextResponse.json({ data: { appointments } });
}
