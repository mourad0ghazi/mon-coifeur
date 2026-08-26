import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { db } from '@/lib/platform-store';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const q = url.searchParams.get('q') || undefined;
  let sql = 'SELECT * FROM appointments WHERE 1=1';
  const args: any[] = [];
  if (status && status !== 'TOUS') { sql += ' AND status=?'; args.push(status); }
  if (q) {
    sql += ' AND (lower(client_name) LIKE ? OR lower(client_phone) LIKE ? OR lower(reference) LIKE ?)';
    const like = `%${q.toLowerCase()}%`; args.push(like, like, like);
  }
  sql += ' ORDER BY date DESC, start_minutes DESC LIMIT 200';
  const rows = db.prepare(sql).all(...args) as any[];
  return NextResponse.json({ data: { appointments: rows, total: rows.length } });
}
