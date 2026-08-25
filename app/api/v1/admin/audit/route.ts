import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { listAudit } from '@/lib/platform-store';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  return NextResponse.json({ data: { entries: listAudit(limit) } });
}
