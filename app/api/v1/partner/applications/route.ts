import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPartnerApplication } from '@/lib/platform-store';
import { normalizePhone } from '@/lib/auth-store';

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(8),
  experience: z.string().min(1),
  salonName: z.string().min(1).max(120),
  city: z.string().min(1),
  neighborhood: z.string().min(1),
  address: z.string().max(300).optional(),
  landmark: z.string().max(200).optional(),
  specialties: z.array(z.string()).min(1),
  photos: z.array(z.string().url().or(z.string().startsWith('/uploads/'))).default([]),
  consent: z.boolean(),
  legalConsent: z.boolean(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'DONNEES_INVALIDES', details: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  if (!data.consent || !data.legalConsent) {
    return NextResponse.json({ error: 'CONSENTEMENT_REQUIS' }, { status: 422 });
  }
  const app = createPartnerApplication({ ...data, photosCount: data.photos.length, phone: normalizePhone(data.phone) });
  return NextResponse.json({ data: { application: app } }, { status: 201 });
}
