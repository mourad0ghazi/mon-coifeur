import { NextResponse } from 'next/server';
import { getBarberStatus } from '@/lib/barbers';

export async function GET(_req: Request, { params }: { params: Promise<{ barberId: string }> }) {
  const { barberId } = await params;
  return NextResponse.json({ data: { barberId, status: getBarberStatus(barberId) } });
}
