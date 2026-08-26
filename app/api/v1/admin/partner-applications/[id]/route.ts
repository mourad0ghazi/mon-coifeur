import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { getPartnerApplication, updatePartnerApplication, writeAudit } from '@/lib/platform-store';
import { activateCoiffeurForApplication } from '@/lib/auth-store';
import { notifyPartnerValidated, type PartnerNotificationResult } from '@/lib/partner-notifications';
import { z } from 'zod';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const app = getPartnerApplication(id);
  if (!app) return NextResponse.json({ error: 'INTROUVABLE' }, { status: 404 });
  return NextResponse.json({ data: { application: app } });
}

const patchSchema = z.object({
  status: z.enum(['VALIDE', 'REFUSE', 'INFOS_DEMANDEES', 'EN_ATTENTE']).optional(),
  internalNote: z.string().max(2000).optional(),
  checks: z.array(z.boolean()).length(6).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'DONNEES_INVALIDES' }, { status: 422 });

  const current = getPartnerApplication(id);
  if (!current) return NextResponse.json({ error: 'INTROUVABLE' }, { status: 404 });

  const shouldNotify = parsed.data.status === 'VALIDE' && current.status !== 'VALIDE';
  // Quand l'admin valide un coiffeur, on crée/active son compte EN PREMIER
  // (l'activation peut échouer si le téléphone est déjà utilisé par un client).
  if (shouldNotify) {
    try {
      activateCoiffeurForApplication({
        id: current.id,
        first_name: current.first_name,
        last_name: current.last_name,
        phone: current.phone,
        salon_name: current.salon_name,
      });
    } catch (e: any) {
      if (e?.message === 'PHONE_USED_BY_OTHER_ROLE') {
        return NextResponse.json(
          { error: 'PHONE_USED_BY_OTHER_ROLE', message: 'Ce numéro WhatsApp est déjà utilisé par un compte client.' },
          { status: 409 }
        );
      }
      throw e;
    }
  }

  const app = updatePartnerApplication(id, {
    status: parsed.data.status,
    internal_note: parsed.data.internalNote,
    checks: parsed.data.checks,
  })!;
  let notification: PartnerNotificationResult | undefined;
  if (shouldNotify) notification = await notifyPartnerValidated(current);

  writeAudit({
    actorId: guard.user.sub,
    actorName: guard.user.name,
    action: parsed.data.status === 'VALIDE' ? 'PARTNER_VALIDATED' : 'PARTNER_APPLICATION_UPDATED',
    target: app.reference,
    meta: { status: parsed.data.status, notification: notification?.status || null },
  });
  return NextResponse.json({ data: { application: app }, meta: { notification: notification || null } });
}
