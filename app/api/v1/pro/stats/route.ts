import { NextResponse } from 'next/server';
import { requirePro } from '@/lib/api-guard';
import { proStats } from '@/lib/platform-store';

export async function GET() {
  const guard = await requirePro();
  if ('error' in guard) return guard.error;
  return NextResponse.json({ data: proStats(guard.user.sub) });
}
