import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { platformStats } from '@/lib/platform-store';

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  return NextResponse.json({ data: platformStats() });
}
