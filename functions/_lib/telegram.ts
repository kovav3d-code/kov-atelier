/**
 * Bot Telegram de l'atelier.
 * - Alerte instantanée à chaque demande (résumé, numéro cliquable, photos et fichiers du client).
 * - Boutons de réponse : prix, appel, questions → aperçu de l'e-mail → envoi au client après « Envoyer ».
 * Secrets Cloudflare : TELEGRAM_BOT_TOKEN (donné par @BotFather) et TELEGRAM_CHAT_ID.
 * Sans ces secrets, rien n'est envoyé. Une erreur Telegram n'empêche jamais l'enregistrement d'une demande.
 */
import type { Env } from './env';
import { echapper } from './env';

const court = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
export type Bouton = { text: string; url?: string; callback_data?: string };

export const telegramActif = (env: Env) => Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);

/** Appel JSON à l'API Bot. */
export async function tg(env: Env, methode: string, corps: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${methode}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
  });
  if (!r.ok) console.error(`Telegram ${methode} refusé`, r.status, await r.text());
  return r.ok ? ((await r.json()) as { result?: unknown }).result : null;
}

export async function message(env: Env, texte: string, boutons: Bouton[][] = [], extra: Record<string, unknown> = {}) {
  if (!telegramActif(env)) return null;
  try {
    return await tg(env, 'sendMessage', {
      chat_id: env.TELEGRAM_CHAT_ID, text: texte, parse_mode: 'HTML', disable_web_page_preview: true,
      ...(boutons.length ? { reply_markup: { inline_keyboard: boutons } } : {}), ...extra,
    });
  } catch (e) { console.error('Message Telegram non envoyé', e); return null; }
}

/** Compatibilité : alerte simple (une ligne par élément, vides ignorés). */
export async function alerteTelegram(env: Env, lignes: (string | null | false | undefined)[], boutons: Bouton[] = []) {
  await message(env, lignes.filter(Boolean).join('\n'), boutons.map((b) => [b]));
}

const IMAGES = ['jpg', 'jpeg', 'png'];
/** Envoie les fichiers du client dans Telegram : photos en aperçu, autres fichiers (STL, STEP, PDF…) en document. */
export async function envoyerFichiersTelegram(env: Env, ref: string, fichiers: File[]) {
  if (!telegramActif(env)) return;
  for (const f of fichiers) {
    const ext = (f.name.split('.').pop() ?? '').toLowerCase();
    const photo = IMAGES.includes(ext) && f.size <= 10 * 1024 * 1024; // sendPhoto : 10 Mo max
    const fd = new FormData();
    fd.append('chat_id', String(env.TELEGRAM_CHAT_ID));
    fd.append('caption', `${ref} · ${f.name}`.slice(0, 1000));
    fd.append(photo ? 'photo' : 'document', f, f.name);
    try {
      const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${photo ? 'sendPhoto' : 'sendDocument'}`, { method: 'POST', body: fd });
      if (!r.ok) console.error('Fichier Telegram refusé', ref, f.name, r.status, await r.text());
    } catch (e) { console.error('Fichier Telegram non envoyé', ref, f.name, e); }
  }
}

/** Boutons de réponse attachés à chaque nouvelle demande. */
export const boutonsDemande = (ref: string): Bouton[][] => [
  [{ text: 'Envoyer un prix', callback_data: `prix:${ref}` }],
  [{ text: 'Proposer un appel', callback_data: `appel:${ref}` }, { text: 'Poser des questions', callback_data: `questions:${ref}` }],
  [{ text: 'Ouvrir dans Gmail', url: lienGmail(ref) }],
];

/** Ligne « libellé : valeur » échappée, ou null si la valeur est vide. */
export const ligne = (libelle: string, valeur: string | null | undefined, max = 300) =>
  valeur ? `<b>${libelle}</b> : ${echapper(court(valeur, max))}` : null;

/** Numéro au format international (Telegram le rend cliquable pour appeler). */
export const numeroIntl = (t: string | null | undefined) => {
  if (!t) return null;
  const n = t.replace(/[^\d+]/g, '');
  return n.startsWith('+') ? n : n.startsWith('00') ? `+${n.slice(2)}` : n.startsWith('0') ? `+33${n.slice(1)}` : n;
};
export const telephoneCliquable = (t: string | null | undefined) =>
  t ? `<b>Téléphone</b> : ${echapper(numeroIntl(t)!)} (toucher pour appeler)` : null;

export const lienGmail = (recherche: string) => `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(recherche)}`;

/** Jeton secret du webhook, dérivé du jeton du bot (aucun secret supplémentaire à gérer). */
export async function secretWebhook(env: Env) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kov-webhook:${env.TELEGRAM_BOT_TOKEN}`));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}
