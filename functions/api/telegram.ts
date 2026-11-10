/**
 * POST /api/telegram : webhook du bot Telegram de l'atelier.
 * Boutons d'une demande → questions courtes (prix, délai, créneau d'appel, précisions)
 * → aperçu de l'e-mail → « Envoyer au client ». Rien n'est envoyé au client sans ce dernier bouton.
 * Seule la conversation TELEGRAM_CHAT_ID est écoutée ; l'appel doit porter le jeton secret du webhook.
 */
import type { Env } from '../_lib/env';
import { echapper } from '../_lib/env';
import { tg, message, secretWebhook, numeroIntl } from '../_lib/telegram';
import { envoyerEmail } from '../_lib/emails';
import { redigerReponse, type Demande, type TypeReponse } from '../_lib/reponses';

type Etat = { type: TypeReponse; ref: string; etape: string; donnees: Record<string, string> };
const STATUT: Record<TypeReponse, string> = { prix: 'devis_envoye', appel: 'appel_prevu', questions: 'questions_envoyees' };

async function lireEtat(env: Env): Promise<Etat | null> {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS telegram_etat (chat_id TEXT PRIMARY KEY, etat TEXT NOT NULL, maj TEXT NOT NULL)').run();
  const r = await env.DB.prepare('SELECT etat FROM telegram_etat WHERE chat_id = ?1').bind(String(env.TELEGRAM_CHAT_ID)).first<{ etat: string }>();
  try { return r ? (JSON.parse(r.etat) as Etat) : null; } catch { return null; }
}
const ecrireEtat = (env: Env, e: Etat) =>
  env.DB.prepare('INSERT INTO telegram_etat (chat_id, etat, maj) VALUES (?1, ?2, ?3) ON CONFLICT(chat_id) DO UPDATE SET etat = ?2, maj = ?3')
    .bind(String(env.TELEGRAM_CHAT_ID), JSON.stringify(e), new Date().toISOString()).run();
const effacerEtat = (env: Env) => env.DB.prepare('DELETE FROM telegram_etat WHERE chat_id = ?1').bind(String(env.TELEGRAM_CHAT_ID)).run();

const lireDemande = (env: Env, ref: string) =>
  env.DB.prepare('SELECT id, nom, email, telephone, prestation, description FROM demandes WHERE id = ?1').bind(ref).first<Demande>();

const repondre = (env: Env, texte: string) => message(env, texte, [], { reply_markup: { force_reply: true, input_field_placeholder: 'Ta réponse…' } });

async function apercu(env: Env, e: Etat, d: Demande) {
  const m = redigerReponse(e.type, d, { ...e.donnees, numero: e.type === 'appel' ? numeroIntl(d.telephone) ?? undefined : undefined });
  e.etape = 'apercu';
  await ecrireEtat(env, e);
  await message(env,
    `<b>Aperçu de l'e-mail pour ${echapper(d.nom)}</b> (${echapper(d.email)})\n<b>Objet</b> : ${echapper(m.subject)}\n\n${echapper(m.text)}`,
    [[{ text: 'Envoyer au client', callback_data: `ok:${e.ref}` }], [{ text: 'Recommencer', callback_data: `${e.type}:${e.ref}` }, { text: 'Annuler', callback_data: `annuler:${e.ref}` }]]);
}

async function surBouton(env: Env, data: string) {
  const [action, ref] = data.split(':');
  if (action === 'annuler') { await effacerEtat(env); await message(env, 'Annulé. Rien n’a été envoyé.'); return; }
  const d = ref ? await lireDemande(env, ref) : null;
  if (!d) { await message(env, `Demande ${echapper(ref ?? '')} introuvable.`); return; }

  if (action === 'prix' || action === 'appel' || action === 'questions') {
    const e: Etat = { type: action, ref, etape: action === 'prix' ? 'prix' : action === 'appel' ? 'creneau' : 'questions', donnees: {} };
    await ecrireEtat(env, e);
    const qui = `${ref} · ${echapper(d.nom)}`;
    if (action === 'prix') await repondre(env, `${qui}\n<b>Quel prix ?</b> Écris-le comme il doit apparaître, par ex. « 180 € TTC » ou « 150 € HT + port ».`);
    if (action === 'appel') await repondre(env, `${qui}\n<b>Quand vas-tu l'appeler ?</b> Par ex. « demain mercredi vers 14 h ».${d.telephone ? `\nSon numéro : ${echapper(numeroIntl(d.telephone)!)}` : '\nIl n’a pas laissé de numéro : l’e-mail le lui demandera.'}`);
    if (action === 'questions') await repondre(env, `${qui}\n<b>Quelles questions lui poser ?</b> Une par ligne.`);
    return;
  }

  if (action === 'ok') {
    const e = await lireEtat(env);
    if (!e || e.ref !== ref || e.etape !== 'apercu') { await message(env, 'Cet aperçu n’est plus valable. Recommence depuis les boutons de la demande.'); return; }
    const m = redigerReponse(e.type, d, { ...e.donnees, numero: e.type === 'appel' ? numeroIntl(d.telephone) ?? undefined : undefined });
    try {
      await envoyerEmail(env, { to: d.email, replyTo: env.MAIL_ATELIER, bcc: env.MAIL_ATELIER, ...m });
      await env.DB.prepare('UPDATE demandes SET statut = ?1 WHERE id = ?2').bind(STATUT[e.type], ref).run();
      await effacerEtat(env);
      await message(env, `Envoyé à ${echapper(d.email)}. Une copie est dans ton Gmail ; sa réponse arrivera aussi dans Gmail.`);
    } catch (err) {
      console.error('Réponse client non envoyée', ref, err);
      const domaine = /domain|verify|testing emails|own email/i.test(String(err));
      await message(env, domaine
        ? 'Non envoyé : tant que le domaine kov-atelier.fr n’est pas vérifié chez Resend, les e-mails ne peuvent partir que vers ta propre adresse. Branche le domaine, puis réessaie avec « Envoyer au client ».'
        : `Non envoyé, erreur technique : ${echapper(String(err).slice(0, 300))}`);
    }
  }
}

async function surTexte(env: Env, texte: string) {
  if (texte.startsWith('/start') || texte.startsWith('/aide')) {
    await message(env, 'Bot Kov Atelier. Chaque demande de devis arrive ici avec ses photos et fichiers. Sous chaque demande : « Envoyer un prix », « Proposer un appel » ou « Poser des questions ». Je te montre l’e-mail avant de l’envoyer au client.');
    return;
  }
  const e = await lireEtat(env);
  if (!e) { await message(env, 'Utilise les boutons sous une demande pour répondre à un client.'); return; }
  const d = await lireDemande(env, e.ref);
  if (!d) { await effacerEtat(env); await message(env, 'Demande introuvable.'); return; }
  const t = texte.trim().slice(0, 1500);
  if (e.etape === 'prix') { e.donnees.prix = t; e.etape = 'delai'; await ecrireEtat(env, e); await repondre(env, `<b>Quel délai ?</b> Par ex. « 10 jours ouvrés après validation ».`); return; }
  if (e.etape === 'delai') { e.donnees.delai = t; await apercu(env, e, d); return; }
  if (e.etape === 'creneau') { e.donnees.creneau = t; await apercu(env, e, d); return; }
  if (e.etape === 'questions') {
    e.donnees.questions = t.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `• ${l.replace(/^[-•*]\s*/, '')}`).join('\n');
    await apercu(env, e, d); return;
  }
  await message(env, 'Un aperçu attend ta décision : « Envoyer au client », « Recommencer » ou « Annuler ».');
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return new Response('ok');
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== (await secretWebhook(env))) return new Response('interdit', { status: 403 });
  let u: any;
  try { u = await request.json(); } catch { return new Response('ok'); }
  try {
    if (u.callback_query) {
      if (String(u.callback_query.message?.chat?.id) !== String(env.TELEGRAM_CHAT_ID)) return new Response('ok');
      await tg(env, 'answerCallbackQuery', { callback_query_id: u.callback_query.id });
      await surBouton(env, String(u.callback_query.data ?? ''));
    } else if (u.message?.text) {
      if (String(u.message.chat?.id) !== String(env.TELEGRAM_CHAT_ID)) return new Response('ok');
      await surTexte(env, String(u.message.text));
    }
  } catch (e) { console.error('Webhook Telegram', e); }
  return new Response('ok'); // toujours 200, sinon Telegram renvoie le même message en boucle
};
