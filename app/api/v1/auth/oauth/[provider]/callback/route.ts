import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateOAuthUserByProfile } from '@/lib/auth-store';
import { AUTH_COOKIE, createSessionToken, sessionCookieOptions, type AuthRole } from '@/lib/auth';
import { isProvider, type Provider, verifyState, handleOAuthCallback } from '@/lib/oauth';

const OAUTH_STATE_COOKIE = 'hlaqti_oauth_state';

function destinationFor(role: AuthRole, status: string): string {
  if (role === 'COIFFEUR') return status === 'ACTIF' ? '/pro' : '/devenir-partenaire';
  if (role === 'SUPER_ADMIN') return '/admin';
  return '/mon-compte';
}

function errorRedirect(reason: string, req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(`/connexion?erreur=${reason}`, req.url));
}

/**
 * Handles both Google/Facebook (GET with ?code) and Apple (POST form_post).
 * Shared logic extracts code + state, verifies state, exchanges, creates the
 * session, and redirects to the role-appropriate page.
 */
async function complete(req: NextRequest, provider: Provider): Promise<NextResponse> {
  const isPost = req.method === 'POST';
  const formData = isPost ? await req.formData() : null;

  const code = isPost
    ? String(formData!.get('code') || '')
    : req.nextUrl.searchParams.get('code') || '';
  const state = isPost
    ? String(formData!.get('state') || '')
    : req.nextUrl.searchParams.get('state') || '';

  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return errorRedirect('oauth_state_invalide', req);
  }

  const verified = await verifyState(state);
  if (!verified || verified.provider !== provider) {
    return errorRedirect('oauth_state_invalide', req);
  }
  const role: AuthRole = verified.role;

  // Apple sends the user's name only on first authorization, as a JSON blob.
  let appleUser: { firstName?: string; lastName?: string } | undefined;
  if (provider === 'apple' && isPost) {
    const userBlob = String(formData!.get('user') || '');
    if (userBlob) {
      try {
        const parsed = JSON.parse(userBlob);
        appleUser = { firstName: parsed?.name?.firstName, lastName: parsed?.name?.lastName };
      } catch { /* ignore malformed */ }
    }
  }

  let profile;
  try {
    profile = await handleOAuthCallback(provider, code, appleUser);
  } catch {
    return errorRedirect('oauth_echange_token', req);
  }

  const user = findOrCreateOAuthUserByProfile(provider, role, profile);
  const token = await createSessionToken(user);
  const response = NextResponse.redirect(new URL(destinationFor(user.role, user.status), req.url));
  response.cookies.set(AUTH_COOKIE, token, sessionCookieOptions);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await params;
  if (!isProvider(raw)) return NextResponse.json({ error: 'FOURNISSEUR_INCONNU' }, { status: 404 });
  return complete(req, raw as Provider);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: raw } = await params;
  if (!isProvider(raw)) return NextResponse.json({ error: 'FOURNISSEUR_INCONNU' }, { status: 404 });
  return complete(req, raw as Provider);
}
