import { NextResponse } from 'next/server';
import { z } from 'zod';
import { consumeOtp, findOrCreateUser, normalizePhone, registerUser } from '@/lib/auth-store';
import { createSessionToken, sessionCookieOptions, type AuthRole, AUTH_COOKIE } from '@/lib/auth';

const schema = z.object({
  phone: z.string(),
  code: z.string().regex(/^\d{6}$/),
  role: z.enum(['CLIENT', 'COIFFEUR', 'SUPER_ADMIN']),
  name: z.string().max(120).optional(),
  register: z
    .object({
      firstName: z.string().min(1).max(60),
      lastName: z.string().min(1).max(60),
      email: z.string().email().or(z.literal('')).optional(),
      gender: z.enum(['HOMME', 'FEMME', 'AUTRE', '']).optional(),
      birthYear: z.number().int().min(1940).max(2012).nullable().optional(),
      city: z.string().max(120).optional(),
      neighborhood: z.string().max(120).optional(),
      locale: z.enum(['fr', 'ary', 'ar', 'en']).optional(),
      cutPreferences: z.string().max(500).optional(),
      newsletter: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'DONNEES_INVALIDES' }, { status: 422 });
  const phone = normalizePhone(parsed.data.phone);
  const verified = consumeOtp(phone, parsed.data.code);
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 401 });

  const role = parsed.data.role as AuthRole;
  let result;
  if (parsed.data.register) {
    result = registerUser({
      phone,
      role,
      firstName: parsed.data.register.firstName,
      lastName: parsed.data.register.lastName,
      email: parsed.data.register.email || undefined,
      gender: parsed.data.register.gender || undefined,
      birthYear: parsed.data.register.birthYear ?? undefined,
      city: parsed.data.register.city,
      neighborhood: parsed.data.register.neighborhood,
      locale: parsed.data.register.locale,
      cutPreferences: parsed.data.register.cutPreferences,
      newsletter: parsed.data.register.newsletter,
    });
    if ('error' in result)
      return NextResponse.json(
        {
          error: 'ROLE_INCORRECT',
          message: `Ce numéro est déjà associé à un compte ${result.user.role === 'CLIENT' ? 'client' : 'professionnel'}.`,
        },
        { status: 409 }
      );
  } else {
    const r = findOrCreateUser(phone, role, parsed.data.name);
    if ('error' in r)
      return NextResponse.json(
        {
          error: 'ROLE_INCORRECT',
          message: `Ce numéro est déjà associé à un compte ${r.user.role === 'CLIENT' ? 'client' : 'professionnel'}.`,
        },
        { status: 409 }
      );
    result = r;
  }

  const user = result.user;
  const token = await createSessionToken(user);
  const redirect =
    user.role === 'CLIENT'
      ? '/mon-compte'
      : user.role === 'SUPER_ADMIN'
        ? '/admin'
        : user.status === 'ACTIF'
          ? '/pro'
          : '/devenir-partenaire';
  const response = NextResponse.json({ data: { user, redirect, isNew: !('existed' in result) || !result.existed } });
  response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions);
  return response;
}
