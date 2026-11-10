import type { Env } from './env';

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
let certsCache: { t: number; keys: JsonWebKey[] & { kid?: string }[] } | null = null;

/**
 * Vérifie le jeton Cloudflare Access (signature, audience, émetteur, expiration).
 * Sans configuration Access, l'accès est REFUSÉ (fermé par défaut).
 */
export async function accesAutorise(request: Request, env: Env): Promise<boolean> {
  const jeton = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jeton || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false;
  try {
    const [h, p, s] = jeton.split('.');
    const entete = JSON.parse(new TextDecoder().decode(b64url(h)));
    const charge = JSON.parse(new TextDecoder().decode(b64url(p)));
    const aud = Array.isArray(charge.aud) ? charge.aud : [charge.aud];
    if (!aud.includes(env.ACCESS_AUD)) return false;
    if (charge.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return false;
    if (typeof charge.exp !== 'number' || charge.exp * 1000 < Date.now()) return false;
    if (!certsCache || Date.now() - certsCache.t > 3600_000) {
      const r = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      certsCache = { t: Date.now(), keys: ((await r.json()) as { keys: any[] }).keys };
    }
    const jwk = certsCache.keys.find((k: any) => k.kid === entete.kid);
    if (!jwk) return false;
    const cle = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cle, b64url(s), new TextEncoder().encode(`${h}.${p}`));
  } catch {
    return false;
  }
}
