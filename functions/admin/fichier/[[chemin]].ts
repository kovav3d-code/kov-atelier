/** GET /admin/fichier/<clé> : téléchargement d'un fichier client (toujours en pièce jointe, jamais affiché). */
import type { Env } from '../../_lib/env';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const cle = (Array.isArray(params.chemin) ? params.chemin : [params.chemin]).join('/');
  if (!/^demandes\/KOV-\d{6}-[A-Z0-9]{4}\/[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(cle)) return new Response('Introuvable.', { status: 404 });
  const objet = await env.FICHIERS.get(cle);
  if (!objet) return new Response('Introuvable.', { status: 404 });
  const h = new Headers();
  objet.writeHttpMetadata(h);
  h.set('content-type', 'application/octet-stream');
  h.set('x-content-type-options', 'nosniff');
  return new Response(objet.body, { headers: h });
};
