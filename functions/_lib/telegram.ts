/**
 * Alerte Telegram instantanée à l'atelier (facultative).
 * Secrets Cloudflare : TELEGRAM_BOT_TOKEN (donné par @BotFather) et TELEGRAM_CHAT_ID.
 * Sans ces secrets, rien n'est envoyé. Une erreur Telegram n'empêche jamais l'enregistrement d'une demande.
 */
import type { Env } from './env';
import { echapper } from './env';

const court = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function alerteTelegram(env: Env, lignes: (string | null | false | undefined)[], boutons: { text: string; url: string }[] = []) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: lignes.filter(Boolean).join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(boutons.length ? { reply_markup: { inline_keyboard: boutons.map((b) => [b]) } } : {}),
      }),
    });
    if (!r.ok) console.error('Alerte Telegram refusée', r.status, await r.text());
  } catch (e) { console.error('Alerte Telegram non envoyée', e); }
}

/** Ligne « libellé : valeur » échappée, ou null si la valeur est vide. */
export const ligne = (libelle: string, valeur: string | null | undefined, max = 300) =>
  valeur ? `<b>${libelle}</b> : ${echapper(court(valeur, max))}` : null;

/** Numéro au format international (Telegram le rend cliquable pour appeler). */
export const telephoneCliquable = (t: string | null | undefined) => {
  if (!t) return null;
  const n = t.replace(/[^\d+]/g, '');
  const intl = n.startsWith('+') ? n : n.startsWith('00') ? `+${n.slice(2)}` : n.startsWith('0') ? `+33${n.slice(1)}` : n;
  return `<b>Téléphone</b> : ${echapper(intl)} (toucher pour appeler)`;
};

export const lienGmail = (recherche: string) => `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(recherche)}`;
