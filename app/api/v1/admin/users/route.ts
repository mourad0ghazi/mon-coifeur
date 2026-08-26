import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { listUsers } from '@/lib/auth-store';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || undefined;
  const role = url.searchParams.get('role') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const users = listUsers({ q, role, status });
  return NextResponse.json({ data: { users, total: users.length } });
}
