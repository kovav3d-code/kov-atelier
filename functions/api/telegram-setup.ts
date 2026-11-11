/**
 * GET /api/telegram-setup : branche le bot sur le site (webhook) et affiche l'état du branchement.
 * Sans danger si ouvert à nouveau : il réenregistre la même adresse.
 */
import type { Env } from '../_lib/env';
import { json } from '../_lib/env';
import { tg, secretWebhook } from '../_lib/telegram';

type InfoWebhook = { url?: string; pending_update_count?: number; last_error_date?: number; last_error_message?: string };

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ message: 'Secrets TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID requis.' }, 400);
  const url = `${new URL(request.url).origin}/api/telegram`;
  const ok = await tg(env, 'setWebhook', { url, secret_token: await secretWebhook(env), allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
  const info = (await tg(env, 'getWebhookInfo', {})) as InfoWebhook | null;
  return json({
    message: ok ? 'Bot branché. Écris /start à ton bot : il doit te répondre.' : 'Échec du branchement : vérifie le jeton du bot.',
    webhook: info?.url ?? null,
    messages_en_attente: info?.pending_update_count ?? null,
    derniere_erreur: info?.last_error_message ? `${info.last_error_message} (${new Date((info.last_error_date ?? 0) * 1000).toISOString()})` : 'aucune',
  }, ok ? 200 : 500);
};
