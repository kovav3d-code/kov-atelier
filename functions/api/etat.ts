/**
 * GET /api/etat : diagnostic de configuration.
 * Indique seulement la PRÉSENCE de chaque réglage (oui/non), jamais sa valeur.
 */
import type { Env } from '../_lib/env';
import { json } from '../_lib/env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const e = env as unknown as Record<string, unknown>;
  const present = (k: string) => (e[k] ? 'oui' : 'NON — manquant');
  return json({
    secrets: { TURNSTILE_SECRET_KEY: present('TURNSTILE_SECRET_KEY'), RESEND_API_KEY: present('RESEND_API_KEY') },
    variables: { MAIL_FROM: present('MAIL_FROM'), MAIL_ATELIER: present('MAIL_ATELIER'), SITE_URL: present('SITE_URL'), ENVIRONMENT: String(e.ENVIRONMENT ?? 'NON — manquant') },
    liaisons: { 'DB (base D1)': present('DB'), 'FICHIERS (stockage R2)': present('FICHIERS') },
  });
};
