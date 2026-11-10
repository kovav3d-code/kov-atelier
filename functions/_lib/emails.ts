import type { Env } from './env';
import { echapper } from './env';

export type PieceJointe = { filename: string; content: string }; // content : base64

/** Encode des octets en base64 par blocs (évite le dépassement de pile sur les gros fichiers). */
export function enBase64(octets: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < octets.length; i += 0x8000) bin += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function envoyerEmail(env: Env, msg: { to: string; subject: string; html: string; text: string; replyTo?: string; bcc?: string; attachments?: PieceJointe[] }) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY manquante');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text,
      ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      ...(msg.bcc ? { bcc: [msg.bcc] } : {}),
      ...(msg.attachments?.length ? { attachments: msg.attachments } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status} : ${await r.text()}`);
}

type Ligne = [string, string | null | undefined];
const tableau = (lignes: Ligne[]) =>
  `<table cellpadding="6" style="border-collapse:collapse;font:14px/1.5 Arial,sans-serif;color:#20252B">${lignes
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="color:#535C65;vertical-align:top;white-space:nowrap">${echapper(k)}</td><td style="white-space:pre-wrap">${echapper(String(v))}</td></tr>`)
    .join('')}</table>`;

export function emailAtelier(d: Record<string, string | null>, ref: string, liens: { nom: string; url: string; taille: string }[], joints = false) {
  const lignes: Ligne[] = [
    ['Référence', ref], ['Nom', d.nom], ['Entreprise', d.entreprise], ['E-mail', d.email], ['Téléphone', d.telephone],
    ['Prestation', d.prestationLibelle], ['Description', d.description], ['Dimensions', d.dimensions], ['Quantité', d.quantite],
    ['Matériau', d.materiau], ['Délai', d.delai], ['Budget', d.budget],
  ];
  const fichiersHtml = liens.length
    ? `<p style="font:600 14px Arial,sans-serif;color:#20252B;margin:20px 0 6px">Fichiers (${joints ? 'joints à cet e-mail et ' : ''}accessibles dans l’espace protégé)</p><ul style="font:14px/1.6 Arial,sans-serif">${liens.map((l) => `<li><a href="${echapper(l.url)}">${echapper(l.nom)}</a> (${l.taille})</li>`).join('')}</ul>`
    : '<p style="font:14px Arial,sans-serif;color:#535C65">Aucun fichier joint.</p>';
  return {
    subject: `Nouvelle demande de devis ${ref} : ${d.prestationLibelle}`,
    html: `<div style="max-width:640px"><p style="font:700 18px Arial,sans-serif;color:#20252B">Nouvelle demande de devis</p>${tableau(lignes)}${fichiersHtml}<p style="font:12px Arial,sans-serif;color:#89939C;margin-top:24px">Répondez directement à cet e-mail pour écrire au client.</p></div>`,
    text: [...lignes.filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`), '', 'Fichiers :', ...(liens.length ? liens.map((l) => `- ${l.nom} : ${l.url}`) : ['aucun'])].join('\n'),
  };
}

/** Confirmation client volontairement sobre : elle ne recopie pas le texte saisi (évite tout usage abusif du formulaire). */
export function emailClient(ref: string, prestation: string, nombreFichiers: number) {
  const corps = [
    'Bonjour,',
    `Votre demande de devis a bien été reçue par Kov Atelier. Sa référence est ${ref}.`,
    `Prestation : ${prestation}. Fichiers reçus : ${nombreFichiers}.`,
    'L’atelier étudie votre projet et vous répondra personnellement. Vous pouvez répondre à cet e-mail pour ajouter une précision.',
    'Kov Atelier, Florange (Moselle)',
  ];
  return {
    subject: `Votre demande de devis ${ref} a bien été reçue`,
    html: `<div style="max-width:560px;font:15px/1.6 Arial,sans-serif;color:#20252B">${corps.map((p) => `<p>${echapper(p)}</p>`).join('')}</div>`,
    text: corps.join('\n\n'),
  };
}
