import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPartnerApplication } from '@/lib/platform-store';
import { normalizePhone } from '@/lib/auth-store';

const uploadedPhoto = z.string().url().or(z.string().startsWith('/uploads/'));
const staffMember = z.object({
  name: z.string().min(2).max(100),
  specialty: z.string().max(120).optional(),
  hours: z.string().min(3).max(80),
});
const service = z.object({
  name: z.string().min(2).max(100),
  price: z.number().int().min(1).max(10000),
  duration: z.number().int().min(5).max(480),
});
const openingHour = z.object({
  day: z.string().min(2).max(20),
  on: z.boolean(),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  breakStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  breakEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

const schema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(8),
  experience: z.string().min(1).max(30),
  salonName: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  neighborhood: z.string().min(2).max(100),
  address: z.string().min(5).max(300),
  landmark: z.string().max(200).optional(),
  placeId: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  specialties: z.array(z.string().min(1).max(80)).min(1).max(20),
  photos: z.array(uploadedPhoto).min(3).max(100),
  certificatePhoto: uploadedPhoto,
  chairCount: z.number().int().min(1).max(50),
  staff: z.array(staffMember).min(1).max(50),
  serviceCatalog: z.array(service).min(1).max(50),
  openingHours: z.array(openingHour).min(1).max(7),
  consent: z.boolean(),
  legalConsent: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.staff.length !== value.chairCount) {
    ctx.addIssue({ code: 'custom', path: ['staff'], message: 'Un nom est requis pour chaque chaise.' });
  }
  if (value.openingHours.some((day) => day.on && (!day.open || !day.close))) {
    ctx.addIssue({ code: 'custom', path: ['openingHours'], message: 'Chaque jour ouvert doit avoir une heure de début et de fin.' });
  }
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'DONNEES_INVALIDES', details: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;
  if (!data.consent || !data.legalConsent) {
    return NextResponse.json({ error: 'CONSENTEMENT_REQUIS', message: 'Les deux consentements sont obligatoires.' }, { status: 422 });
  }
  const app = createPartnerApplication({ ...data, photosCount: data.photos.length, phone: normalizePhone(data.phone) });
  return NextResponse.json({ data: { application: app } }, { status: 201 });
}
