/** GET /admin : liste des 200 dernières demandes (espace protégé par Cloudflare Access). */
import type { Env } from '../_lib/env';
import { echapper as e } from '../_lib/env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM demandes ORDER BY cree_le DESC LIMIT 200').all<Record<string, string>>();
  const lignes = results.map((d) => {
    const fichiers = JSON.parse(d.fichiers || '[]') as { cle: string; nom: string }[];
    return `<tr><td>${e(d.cree_le.slice(0, 16).replace('T', ' '))}<br><b>${e(d.id)}</b></td>
      <td>${e(d.nom)}${d.entreprise ? `<br>${e(d.entreprise)}` : ''}<br><a href="mailto:${e(d.email)}?subject=${encodeURIComponent('Votre demande ' + d.id)}">${e(d.email)}</a>${d.telephone ? `<br>${e(d.telephone)}` : ''}</td>
      <td><b>${e(d.prestation)}</b><br><span style="white-space:pre-wrap">${e(d.description)}</span>
      ${[['Dimensions', d.dimensions], ['Quantité', d.quantite], ['Matériau', d.materiau], ['Délai', d.delai], ['Budget', d.budget]].filter(([, x]) => x).map(([k, x]) => `<br><small>${k} : ${e(x!)}</small>`).join('')}</td>
      <td>${fichiers.map((f) => `<a href="/admin/fichier/${e(f.cle)}">${e(f.nom)}</a>`).join('<br>') || '–'}</td>
      <td>${d.email_atelier_envoye === '1' || (d.email_atelier_envoye as unknown) === 1 ? 'Oui' : '<b style="color:#B42318">Non</b>'}</td></tr>`;
  }).join('');
  const msgs = (await env.DB.prepare('SELECT * FROM messages ORDER BY cree_le DESC LIMIT 100').all<Record<string, string>>()).results;
  const lignesMsg = msgs.map((m) => `<tr><td>${e(m.cree_le.slice(0, 16).replace('T', ' '))}</td><td>${e(m.nom)}<br><a href="mailto:${e(m.email)}">${e(m.email)}</a>${m.telephone ? `<br>${e(m.telephone)}` : ''}</td><td style="white-space:pre-wrap">${e(m.message)}</td></tr>`).join('');
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demandes de devis | Kov Atelier</title>
  <style>body{font:14px/1.5 system-ui,sans-serif;color:#20252B;background:#F7F8F6;margin:0;padding:24px}table{border-collapse:collapse;width:100%;background:#fff}td,th{border-bottom:1px solid #D9DDDF;padding:10px;text-align:left;vertical-align:top}th{background:#20252B;color:#F7F8F6;font-weight:600}a{color:#2864DC}.wrap{overflow-x:auto}</style>
  <h1 style="font-size:22px">Demandes de devis (${results.length})</h1><div class="wrap"><table><tr><th>Date</th><th>Client</th><th>Projet</th><th>Fichiers</th><th>E-mail atelier</th></tr>${lignes || '<tr><td colspan="5">Aucune demande pour le moment.</td></tr>'}</table></div><h2 style="font-size:18px;margin-top:40px">Messages de contact (${msgs.length})</h2><div class="wrap"><table><tr><th>Date</th><th>Contact</th><th>Message</th></tr>${lignesMsg || '<tr><td colspan="3">Aucun message.</td></tr>'}</table></div></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
