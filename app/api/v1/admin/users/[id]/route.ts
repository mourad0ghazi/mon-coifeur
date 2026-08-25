import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/api-guard';
import { getUserForAdmin, setUserRole, setUserStatus } from '@/lib/auth-store';
import { writeAudit } from '@/lib/platform-store';

const schema = z.object({
  status: z.enum(['ACTIF', 'EN_ATTENTE', 'SUSPENDU', 'BANNI', 'REFUSE']).optional(),
  role: z.enum(['CLIENT', 'COIFFEUR', 'SUPER_ADMIN']).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const user = getUserForAdmin(id);
  if (!user) return NextResponse.json({ error: 'INTROUVABLE' }, { status: 404 });
  return NextResponse.json({ data: { user } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'DONNEES_INVALIDES' }, { status: 422 });
  try {
    let user = getUserForAdmin(id);
    if (!user) return NextResponse.json({ error: 'INTROUVABLE' }, { status: 404 });
    if (parsed.data.status) {
      user = setUserStatus(id, parsed.data.status) || user;
      writeAudit({ actorId: guard.user.sub, actorName: guard.user.name, action: 'USER_STATUS_CHANGED', target: user.phone, meta: { status: parsed.data.status } });
    }
    if (parsed.data.role) {
      user = setUserRole(id, parsed.data.role) || user;
      writeAudit({ actorId: guard.user.sub, actorName: guard.user.name, action: 'USER_ROLE_CHANGED', target: user.phone, meta: { role: parsed.data.role } });
    }
    return NextResponse.json({ data: { user } });
  } catch (e: any) {
    if (e?.message === 'PROTECTED_SUPER_ADMIN')
      return NextResponse.json({ error: 'PROTEGE', message: 'Le super-admin fondateur ne peut pas être modifié.' }, { status: 409 });
    throw e;
  }
}
