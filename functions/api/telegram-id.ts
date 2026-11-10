/**
 * GET /api/telegram-id : aide à l'installation de l'alerte Telegram.
 * Après avoir écrit « /start » au bot, cette page affiche l'identifiant de la conversation (TELEGRAM_CHAT_ID).
 * Désactivée automatiquement dès que TELEGRAM_CHAT_ID est configuré.
 */
import type { Env } from '../_lib/env';
import { json } from '../_lib/env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (env.TELEGRAM_CHAT_ID) return json({ message: 'Déjà configuré. Cette page est désactivée.' }, 404);
  if (!env.TELEGRAM_BOT_TOKEN) return json({ message: 'Ajoute d’abord le secret TELEGRAM_BOT_TOKEN, redéploie, puis écris /start à ton bot.' }, 400);
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`);
  if (!r.ok) return json({ message: 'Le jeton du bot est refusé par Telegram. Vérifie TELEGRAM_BOT_TOKEN.' }, 400);
  const data = (await r.json()) as { result?: { message?: { chat?: { id: number; first_name?: string; type?: string } } }[] };
  const chats = new Map<number, string>();
  for (const u of data.result ?? []) { const c = u.message?.chat; if (c && c.type === 'private') chats.set(c.id, c.first_name ?? ''); }
  if (!chats.size) return json({ message: 'Aucun message reçu. Ouvre ton bot dans Telegram, touche « Démarrer » (ou écris /start), puis recharge cette page.' });
  return json({ message: 'Copie le nombre ci-dessous dans le secret TELEGRAM_CHAT_ID.', conversations: [...chats].map(([id, nom]) => ({ TELEGRAM_CHAT_ID: String(id), prenom: nom })) });
};
