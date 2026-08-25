import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { listPartnerApplications } from '@/lib/platform-store';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const q = url.searchParams.get('q') || undefined;
  const apps = listPartnerApplications({ status, q });
  return NextResponse.json({ data: { applications: apps, total: apps.length } });
}
