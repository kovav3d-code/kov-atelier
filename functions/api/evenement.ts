/** POST /api/evenement : compteur de conversions anonyme (aucun cookie, aucune IP, aucun identifiant). */
import type { Env } from '../_lib/env';

const AUTORISES = new Set(['devis_clic', 'devis_commence']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const corps = (await request.json()) as { e?: string; s?: string | null; p?: string };
    if (!corps.e || !AUTORISES.has(corps.e)) return new Response(null, { status: 204 });
    await env.DB.prepare('INSERT INTO evenements (jour, nom, source, page) VALUES (?1, ?2, ?3, ?4)')
      .bind(new Date().toISOString().slice(0, 10), corps.e, (corps.s ?? '').slice(0, 40) || null, (corps.p ?? '').slice(0, 120) || null)
      .run();
  } catch { /* silencieux */ }
  return new Response(null, { status: 204 });
};
