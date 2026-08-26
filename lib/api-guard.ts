import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE, readSessionToken } from '@/lib/auth';

export async function requireSession() {
  const store = await cookies();
  return readSessionToken(store.get(AUTH_COOKIE)?.value);
}

export async function requireAdmin() {
  const user = await requireSession();
  if (!user) return { error: NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 }) };
  if (user.role !== 'SUPER_ADMIN') return { error: NextResponse.json({ error: 'ACCES_REFUSE' }, { status: 403 }) };
  return { user };
}

export async function requirePro() {
  const user = await requireSession();
  if (!user) return { error: NextResponse.json({ error: 'NON_AUTHENTIFIE' }, { status: 401 }) };
  if (user.role !== 'COIFFEUR' && user.role !== 'SUPER_ADMIN')
    return { error: NextResponse.json({ error: 'ACCES_REFUSE' }, { status: 403 }) };
  return { user };
}
