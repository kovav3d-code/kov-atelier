/**
 * GET /api/telegram-setup : branche le bot sur le site (webhook). À ouvrir une fois après le déploiement.
 * Sans danger si ouvert à nouveau : il ne fait que réenregistrer la même adresse.
 */
import type { Env } from '../_lib/env';
import { json } from '../_lib/env';
import { tg, secretWebhook } from '../_lib/telegram';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ message: 'Secrets TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID requis.' }, 400);
  const url = `${new URL(request.url).origin}/api/telegram`;
  const ok = await tg(env, 'setWebhook', { url, secret_token: await secretWebhook(env), allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
  return json(ok ? { message: 'Bot branché. Écris /start à ton bot pour vérifier.', webhook: url } : { message: 'Échec du branchement : vérifie le jeton du bot.' }, ok ? 200 : 500);
};
