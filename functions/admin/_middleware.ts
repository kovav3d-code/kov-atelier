/** Tout /admin est réservé à l'atelier, via Cloudflare Access (vérification du jeton signé). */
import type { Env } from '../_lib/env';
import { accesAutorise } from '../_lib/acces';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (!(await accesAutorise(ctx.request, ctx.env))) {
    return new Response('Accès réservé.', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } });
  }
  const r = await ctx.next();
  const h = new Headers(r.headers);
  h.set('x-robots-tag', 'noindex'); h.set('cache-control', 'private, no-store');
  return new Response(r.body, { status: r.status, headers: h });
};
