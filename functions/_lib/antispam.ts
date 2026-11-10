import type { Env } from './env';

/** Contrôles communs aux formulaires : piège à robots, délai minimal de saisie, Cloudflare Turnstile. */
export async function controleAntispam(fd: FormData, request: Request, env: Env): Promise<'ok' | 'robot' | 'refus'> {
  const v = (k: string) => { const x = fd.get(k); return typeof x === 'string' ? x.trim() : ''; };
  if (v('site_web')) return 'robot';
  const t0 = Number(v('t0'));
  if (!t0 || Date.now() - t0 < 3000) return 'refus';
  if (env.TURNSTILE_SECRET_KEY) {
    const verif = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: v('cf-turnstile-response'), remoteip: request.headers.get('CF-Connecting-IP') ?? '' }),
    }).then((r) => r.json() as Promise<{ success: boolean }>).catch(() => ({ success: false }));
    if (!verif.success) return 'refus';
  }
  return 'ok';
}

export const configIncomplete = (env: Env) =>
  env.ENVIRONMENT !== 'development' && (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY || !env.MAIL_ATELIER || !env.MAIL_FROM);
