import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateOAuthUser } from '@/lib/auth-store';
import { AUTH_COOKIE, createSessionToken, sessionCookieOptions, type AuthRole } from '@/lib/auth';
import { isProvider, isProviderConfigured, buildAuthorizeUrl, createState, type Provider } from '@/lib/oauth';

const OAUTH_STATE_COOKIE = 'hlaqti_oauth_state';

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await params;
  if (!isProvider(raw)) return NextResponse.json({ error: 'FOURNISSEUR_INCONNU' }, { status: 404 });
  const provider = raw as Provider;

  const requested = req.nextUrl.searchParams.get('role');
  const role: AuthRole = requested === 'COIFFEUR' ? 'COIFFEUR' : 'CLIENT';

  // Real OAuth: credentials configured → redirect to the provider's authorize page.
  if (isProviderConfigured(provider)) {
    const state = await createState(provider, role);
    const response = NextResponse.redirect(buildAuthorizeUrl(provider, state));
    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 600,
    });
    return response;
  }

  // Not configured in production → refuse cleanly.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/connexion?erreur=provider_non_configure', req.url));
  }

  // Demo fallback (dev only, no credentials): create a demo user immediately.
  const user = findOrCreateOAuthUser(provider, role);
  const token = await createSessionToken(user);
  const destination =
    user.role === 'COIFFEUR' ? (user.status === 'ACTIF' ? '/pro' : '/devenir-partenaire') : '/mon-compte';
  const response = NextResponse.redirect(new URL(destination, req.url));
  response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions);
  return response;
}
