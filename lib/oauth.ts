import { SignJWT, jwtVerify } from 'jose';
import type { AuthRole } from './auth';

export type Provider = 'google' | 'facebook' | 'apple';

type ProviderConfig = {
  authorize: string;
  token: string;
  profile?: string;
  scope: string;
  clientIdEnv: string;
  clientSecretEnv: string;
};

const CONFIGS: Record<Provider, ProviderConfig> = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    profile: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: 'openid email profile',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  facebook: {
    authorize: 'https://www.facebook.com/v19.0/dialog/oauth',
    token: 'https://graph.facebook.com/v19.0/oauth/access_token',
    profile: 'https://graph.facebook.com/me?fields=id,name,email,picture',
    scope: 'email',
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
  },
  apple: {
    authorize: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    scope: 'name email',
    clientIdEnv: 'APPLE_CLIENT_ID',
    clientSecretEnv: 'APPLE_CLIENT_SECRET',
  },
};

export const SUPPORTED: Provider[] = ['google', 'facebook', 'apple'];

export function isProvider(provider: string): provider is Provider {
  return SUPPORTED.includes(provider as Provider);
}

/** A provider is "configured" when its client credentials are present in env. */
export function isProviderConfigured(provider: Provider): boolean {
  const cfg = CONFIGS[provider];
  const clientId = process.env[cfg.clientIdEnv];
  if (!clientId) return false;
  if (provider === 'apple') {
    // Apple needs either a static secret OR the key material to mint one.
    return Boolean(
      process.env.APPLE_CLIENT_SECRET ||
        (process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY),
    );
  }
  return Boolean(process.env[cfg.clientSecretEnv]);
}

function clientId(provider: Provider): string {
  return process.env[CONFIGS[provider].clientIdEnv] || '';
}

export function getRedirectUri(provider: Provider): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/api/v1/auth/oauth/${provider}/callback`;
}

/** State is a short-lived signed JWT (CSRF + carries the chosen role). */
const STATE_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'hlaqti-dev-secret-change-me-before-production',
);

export async function createState(provider: Provider, role: AuthRole): Promise<string> {
  return new SignJWT({ provider, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(STATE_SECRET);
}

export async function verifyState(state: string): Promise<{ provider: Provider; role: AuthRole } | null> {
  try {
    const { payload } = await jwtVerify(state, STATE_SECRET);
    const provider = payload.provider as Provider;
    const role = payload.role as AuthRole;
    if (!isProvider(provider) || !role) return null;
    return { provider, role };
  } catch {
    return null;
  }
}

export function buildAuthorizeUrl(provider: Provider, state: string): string {
  const cfg = CONFIGS[provider];
  const params = new URLSearchParams({
    client_id: clientId(provider),
    redirect_uri: getRedirectUri(provider),
    response_type: 'code',
    scope: cfg.scope,
    state,
  });
  if (provider === 'apple') params.set('response_mode', 'form_post');
  return `${cfg.authorize}?${params.toString()}`;
}

/**
 * Mint an Apple client_secret JWT. Uses a static APPLE_CLIENT_SECRET when
 * provided, otherwise signs a JWT with the ES256 private key material.
 */
async function appleClientSecret(): Promise<string> {
  if (process.env.APPLE_CLIENT_SECRET) return process.env.APPLE_CLIENT_SECRET;
  const { importPKCS8 } = await import('jose/key/import');
  const key = await importPKCS8(process.env.APPLE_PRIVATE_KEY!, 'ES256');
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 5)
    .sign(key);
}

export type OAuthProfile = {
  providerAccountId: string;
  name: string;
  email: string | null;
  avatar: string | null;
};

type TokenResponse = {
  access_token?: string;
  id_token?: string;
};

async function exchangeCode(provider: Provider, code: string): Promise<TokenResponse> {
  const cfg = CONFIGS[provider];
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(provider),
    client_id: clientId(provider),
  });
  if (provider === 'apple') {
    body.set('client_secret', await appleClientSecret());
  } else {
    body.set('client_secret', process.env[cfg.clientSecretEnv] || '');
  }
  const res = await fetch(cfg.token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`TOKEN_EXCHANGE_${provider.toUpperCase()}`);
  return (await res.json()) as TokenResponse;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  return JSON.parse(json);
}

export async function fetchProfile(
  provider: Provider,
  tokens: TokenResponse,
  appleUser?: { firstName?: string; lastName?: string },
): Promise<OAuthProfile> {
  if (provider === 'apple') {
    const claims = decodeJwtPayload(tokens.id_token || '');
    const sub = String(claims.sub || '');
    const email = (claims.email as string) || null;
    const name =
      [appleUser?.firstName, appleUser?.lastName].filter(Boolean).join(' ').trim() ||
      (email ? email.split('@')[0] : 'Utilisateur Apple');
    return { providerAccountId: sub, name, email, avatar: null };
  }

  if (provider === 'google') {
    const res = await fetch(CONFIGS.google.profile!, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) throw new Error('PROFILE_GOOGLE');
    const data = await res.json();
    return {
      providerAccountId: String(data.sub || ''),
      name: String(data.name || data.given_name || 'Utilisateur Google'),
      email: data.email || null,
      avatar: data.picture || null,
    };
  }

  // facebook
  const res = await fetch(CONFIGS.facebook.profile!, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!res.ok) throw new Error('PROFILE_FACEBOOK');
  const data = await res.json();
  return {
    providerAccountId: String(data.id || ''),
    name: String(data.name || 'Utilisateur Facebook'),
    email: data.email || null,
    avatar: data.picture?.data?.url || null,
  };
}

/** Full real flow: exchange code + fetch profile. */
export async function handleOAuthCallback(
  provider: Provider,
  code: string,
  appleUser?: { firstName?: string; lastName?: string },
): Promise<OAuthProfile> {
  const tokens = await exchangeCode(provider, code);
  return fetchProfile(provider, tokens, appleUser);
}
