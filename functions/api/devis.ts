/**
 * POST /api/devis : réception d'une demande de devis.
 * 1. contrôles antispam (piège, délai minimal, Cloudflare Turnstile)
 * 2. validation des champs et des fichiers (extension, poids, signature du contenu)
 * 3. stockage privé des fichiers (R2) puis enregistrement de la demande (D1)
 * 4. notification de l'atelier et confirmation au client (Resend)
 */
import type { Env } from '../_lib/env';
import { json } from '../_lib/env';
import { PRESTATIONS, DELAIS, BUDGETS, FICHIERS, LIMITES, formatTaille } from '../../src/config/devis';
import { contenuValide, extension, extensionAutorisee, nomPropre } from '../_lib/fichiers';
import { envoyerEmail, emailAtelier, emailClient, enBase64, type PieceJointe } from '../_lib/emails';

/** Au-delà, les fichiers ne sont pas joints à l'e-mail atelier (limite Resend : 40 Mo encodés) ; les liens restent. */
const MAX_JOINTS = 25 * 1024 * 1024;
import { controleAntispam, configIncomplete } from '../_lib/antispam';
import { alerteTelegram, ligne, telephoneCliquable, lienGmail } from '../_lib/telegram';

const MESSAGE_SPAM = 'La vérification antispam a échoué. Rechargez la page puis réessayez.';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  // Configuration obligatoire en production : on échoue franchement plutôt que de perdre une demande.
  if (configIncomplete(env)) {
    console.error('Configuration incomplète : TURNSTILE_SECRET_KEY, RESEND_API_KEY, MAIL_FROM ou MAIL_ATELIER manquant.');
    return json({ ok: false, message: 'Le formulaire est momentanément indisponible. Merci de réessayer plus tard.' }, 503);
  }

  const longueur = Number(request.headers.get('content-length') ?? 0);
  if (longueur > FICHIERS.maxTotal + 2 * 1024 * 1024) return json({ ok: false, message: 'Les fichiers dépassent 40 Mo au total.' }, 413);
  if (!(request.headers.get('content-type') ?? '').includes('multipart/form-data')) return json({ ok: false, message: 'Requête invalide.' }, 400);

  let fd: FormData;
  try { fd = await request.formData(); } catch { return json({ ok: false, message: 'Requête invalide.' }, 400); }
  const v = (k: string) => { const x = fd.get(k); return typeof x === 'string' ? x.trim() : ''; };

  // ---- Antispam
  const spam = await controleAntispam(fd, request, env);
  if (spam === 'robot') return json({ ok: true, reference: 'KOV', confirmationEnvoyee: false }); // robot : réponse neutre, rien n'est enregistré
  if (spam === 'refus') return json({ ok: false, message: MESSAGE_SPAM }, 400);

  // ---- Champs
  const erreurs: Record<string, string> = {};
  const d = {
    nom: v('nom'), entreprise: v('entreprise') || null, email: v('email').toLowerCase(), telephone: v('telephone') || null,
    prestation: v('prestation'), description: v('description'),
    dimensions: v('dimensions') || null, quantite: v('quantite') || null, materiau: v('materiau') || null,
    delai: v('delai') || null, budget: v('budget') || null,
  };
  const prestation = PRESTATIONS.find((p) => p.value === d.prestation);
  if (d.nom.length < 2 || d.nom.length > LIMITES.nom) erreurs.nom = 'Indiquez votre nom et prénom.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email) || d.email.length > LIMITES.email) erreurs.email = 'Adresse e-mail invalide.';
  if (d.telephone && !/^[+0-9 ().-]{6,30}$/.test(d.telephone)) erreurs.telephone = 'Numéro de téléphone invalide.';
  if (!prestation) erreurs.prestation = 'Choisissez un type de prestation.';
  if (d.description.length < 10 || d.description.length > LIMITES.description) erreurs.description = 'Description trop courte ou trop longue.';
  if ((d.entreprise?.length ?? 0) > LIMITES.entreprise) erreurs.entreprise = 'Nom d’entreprise trop long.';
  for (const k of ['dimensions', 'quantite', 'materiau'] as const) if ((d[k]?.length ?? 0) > LIMITES.court) erreurs[k] = 'Texte trop long.';
  if (d.delai && !DELAIS.includes(d.delai)) d.delai = null;
  if (d.budget && !BUDGETS.includes(d.budget)) d.budget = null;

  // ---- Fichiers
  const fichiers = fd.getAll('fichiers').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  const total = fichiers.reduce((s, f) => s + f.size, 0);
  if (fichiers.length > FICHIERS.maxNombre) erreurs.fichiers = '10 fichiers maximum.';
  else if (total > FICHIERS.maxTotal) erreurs.fichiers = 'Les fichiers dépassent 40 Mo au total.';
  else for (const f of fichiers) {
    const ext = extension(f.name);
    if (!extensionAutorisee(ext)) { erreurs.fichiers = `« ${f.name} » : format non accepté.`; break; }
    if (f.size > FICHIERS.maxParFichier) { erreurs.fichiers = `« ${f.name} » dépasse 20 Mo.`; break; }
    if (!(await contenuValide(f, ext))) { erreurs.fichiers = `« ${f.name} » ne correspond pas à un fichier ${ext.toUpperCase()} valide.`; break; }
  }
  if (Object.keys(erreurs).length) return json({ ok: false, message: 'Certains champs sont à corriger.', erreurs }, 422);

  // ---- Stockage
  const maintenant = new Date();
  const alea = Array.from(crypto.getRandomValues(new Uint8Array(4)), (x) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[x % 31]).join('');
  const reference = `KOV-${maintenant.toISOString().slice(2, 10).replace(/-/g, '')}-${alea}`;
  const stockes: { cle: string; nom: string; taille: number }[] = [];
  try {
    for (const f of fichiers) {
      const ext = extension(f.name);
      const cle = `demandes/${reference}/${crypto.randomUUID()}.${ext}`; // le nom d'origine n'est jamais utilisé comme chemin
      await env.FICHIERS.put(cle, f.stream(), {
        httpMetadata: { contentType: 'application/octet-stream', contentDisposition: `attachment; filename="${nomPropre(f.name)}"` },
        customMetadata: { nomOrigine: f.name.slice(0, 200), reference },
      });
      stockes.push({ cle, nom: f.name, taille: f.size });
    }
    await env.DB.prepare(
      `INSERT INTO demandes (id, cree_le, nom, entreprise, email, telephone, prestation, description, dimensions, quantite, materiau, delai, budget, fichiers)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
    ).bind(reference, maintenant.toISOString(), d.nom, d.entreprise, d.email, d.telephone, prestation!.label, d.description,
      d.dimensions, d.quantite, d.materiau, d.delai, d.budget, JSON.stringify(stockes)).run();
  } catch (e) {
    console.error('Échec du stockage', e);
    await Promise.allSettled(stockes.map((s) => env.FICHIERS.delete(s.cle)));
    return json({ ok: false, message: 'Une erreur technique a empêché l’enregistrement. Merci de réessayer dans quelques minutes.' }, 500);
  }

  // ---- E-mails (la demande est déjà enregistrée : un échec d'envoi ne la fait pas perdre)
  const base = env.SITE_URL.replace(/\/$/, '');
  const liens = stockes.map((s) => ({ nom: s.nom, taille: formatTaille(s.taille), url: `${base}/admin/fichier/${s.cle}` }));
  // Fichiers joints à la notification atelier : permet de les lire depuis la boîte mail (et par l'assistant connecté à Gmail).
  let pieces: PieceJointe[] = [];
  if (total <= MAX_JOINTS) {
    try {
      pieces = await Promise.all(fichiers.map(async (f) => ({ filename: nomPropre(f.name), content: enBase64(new Uint8Array(await f.arrayBuffer())) })));
    } catch (e) { console.error('Pièces jointes non préparées', reference, e); pieces = []; }
  }
  const mA = emailAtelier({ ...d, prestationLibelle: prestation!.label }, reference, liens, pieces.length > 0);
  const mC = emailClient(reference, prestation!.label, stockes.length);
  const telegram = alerteTelegram(env, [
    `<b>Nouvelle demande de devis</b> · ${reference}`,
    '',
    ligne('Client', `${d.nom}${d.entreprise ? ` (${d.entreprise})` : ' (particulier)'}`),
    telephoneCliquable(d.telephone) ?? '<b>Téléphone</b> : non indiqué',
    ligne('E-mail', d.email),
    ligne('Prestation', prestation!.label),
    ligne('Besoin', d.description, 600),
    ligne('Dimensions', d.dimensions), ligne('Quantité', d.quantite), ligne('Matériau', d.materiau),
    ligne('Délai', d.delai), ligne('Budget', d.budget),
    `<b>Fichiers</b> : ${stockes.length ? `${stockes.length} (joints à l’e-mail)` : 'aucun'}`,
    '',
    'Fiche détaillée dans Claude (Tâches planifiées → Devis Kov Atelier) dans l’heure : réponds-y avec ton prix et ton délai.',
  ], [{ text: 'Ouvrir la demande dans Gmail', url: lienGmail(reference) }]);
  const [atelier, client] = await Promise.allSettled([
    envoyerEmail(env, { to: env.MAIL_ATELIER, replyTo: d.email, ...mA, attachments: pieces })
      .catch((e) => (pieces.length
        ? envoyerEmail(env, { to: env.MAIL_ATELIER, replyTo: d.email, ...emailAtelier({ ...d, prestationLibelle: prestation!.label }, reference, liens) })
        : Promise.reject(e))), // repli sans pièces jointes
    envoyerEmail(env, { to: d.email, replyTo: env.MAIL_ATELIER, ...mC }),
  ]);
  await telegram;
  if (atelier.status === 'rejected') console.error('Notification atelier non envoyée', reference, atelier.reason);
  if (client.status === 'rejected') console.error('Confirmation client non envoyée', reference, client.reason);
  waitUntil(
    env.DB.batch([
      env.DB.prepare('UPDATE demandes SET email_atelier_envoye = ?1 WHERE id = ?2').bind(atelier.status === 'fulfilled' ? 1 : 0, reference),
      env.DB.prepare('INSERT INTO evenements (jour, nom, source, page) VALUES (?1, ?2, ?3, ?4)').bind(maintenant.toISOString().slice(0, 10), 'devis_envoye', prestation!.value, '/devis'),
    ]).catch((e) => console.error(e)),
  );

  return json({ ok: true, reference, confirmationEnvoyee: client.status === 'fulfilled' });
};

export const onRequest: PagesFunction = () => json({ ok: false, message: 'Méthode non autorisée.' }, 405);
