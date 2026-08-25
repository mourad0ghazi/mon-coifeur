import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-guard';
import { getAllSettings, updateSettings, writeAudit } from '@/lib/platform-store';

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  return NextResponse.json({ data: { settings: getAllSettings() } });
}

const schema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'DONNEES_INVALIDES' }, { status: 422 });
  const asStrings: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data)) asStrings[k] = String(v);
  const settings = updateSettings(asStrings);
  writeAudit({ actorId: guard.user.sub, actorName: guard.user.name, action: 'SETTINGS_UPDATED', meta: { keys: Object.keys(asStrings) } });
  return NextResponse.json({ data: { settings } });
}
