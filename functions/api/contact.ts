/** POST /api/contact : message court (sans fichier). Enregistré en base puis transmis à l'atelier. */
import type { Env } from '../_lib/env';
import { json, echapper } from '../_lib/env';
import { LIMITES } from '../../src/config/devis';
import { controleAntispam, configIncomplete } from '../_lib/antispam';
import { envoyerEmail } from '../_lib/emails';
import { alerteTelegram, ligne, telephoneCliquable, lienGmail } from '../_lib/telegram';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (configIncomplete(env)) return json({ ok: false, message: 'Le formulaire est momentanément indisponible. Merci de réessayer plus tard.' }, 503);
  let fd: FormData;
  try { fd = await request.formData(); } catch { return json({ ok: false, message: 'Requête invalide.' }, 400); }
  const spam = await controleAntispam(fd, request, env);
  if (spam === 'robot') return json({ ok: true });
  if (spam === 'refus') return json({ ok: false, message: 'La vérification antispam a échoué. Rechargez la page puis réessayez.' }, 400);

  const v = (k: string) => { const x = fd.get(k); return typeof x === 'string' ? x.trim() : ''; };
  const d = { nom: v('nom'), email: v('email').toLowerCase(), telephone: v('telephone') || null, message: v('message') };
  const erreurs: Record<string, string> = {};
  if (d.nom.length < 2 || d.nom.length > LIMITES.nom) erreurs.nom = 'Indiquez votre nom et prénom.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) || d.email.length > LIMITES.email) erreurs.email = 'Adresse e-mail invalide.';
  if (d.telephone && !/^[+0-9 ().-]{6,30}$/.test(d.telephone)) erreurs.telephone = 'Numéro de téléphone invalide.';
  if (d.message.length < 10 || d.message.length > 3000) erreurs.message = 'Votre message doit contenir entre 10 et 3 000 caractères.';
  if (Object.keys(erreurs).length) return json({ ok: false, message: 'Certains champs sont à corriger.', erreurs }, 422);

  const id = crypto.randomUUID();
  try {
    await env.DB.prepare('INSERT INTO messages (id, cree_le, nom, email, telephone, message) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
      .bind(id, new Date().toISOString(), d.nom, d.email, d.telephone, d.message).run();
  } catch (e) {
    console.error('Échec enregistrement message', e);
    return json({ ok: false, message: 'Une erreur technique a empêché l’envoi. Merci de réessayer dans quelques minutes.' }, 500);
  }
  try {
    await envoyerEmail(env, {
      to: env.MAIL_ATELIER, replyTo: d.email, subject: `Nouveau message de ${d.nom}`,
      html: `<div style="font:14px/1.6 Arial,sans-serif;color:#20252B;max-width:600px"><p><b>${echapper(d.nom)}</b> &lt;${echapper(d.email)}&gt;${d.telephone ? ` · ${echapper(d.telephone)}` : ''}</p><p style="white-space:pre-wrap">${echapper(d.message)}</p><p style="color:#89939C;font-size:12px">Répondez directement à cet e-mail pour écrire à cette personne.</p></div>`,
      text: `${d.nom} <${d.email}>${d.telephone ? ` · ${d.telephone}` : ''}\n\n${d.message}`,
    });
    await env.DB.prepare('UPDATE messages SET email_atelier_envoye = 1 WHERE id = ?1').bind(id).run();
  } catch (e) { console.error('Notification message non envoyée', id, e); }
  await alerteTelegram(env, [
    `<b>Nouveau message (page Contact)</b>`,
    '',
    ligne('De', d.nom), telephoneCliquable(d.telephone), ligne('E-mail', d.email),
    ligne('Message', d.message, 800),
  ], [{ text: 'Ouvrir dans Gmail', url: lienGmail(`Nouveau message de ${d.nom}`) }]);
  return json({ ok: true });
};

export const onRequest: PagesFunction = () => json({ ok: false, message: 'Méthode non autorisée.' }, 405);
