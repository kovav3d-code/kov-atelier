/**
 * E-mails de réponse au client, déclenchés depuis Telegram.
 * Le texte reprend tel quel le prix, le délai, le créneau d'appel ou les questions saisis par l'atelier.
 */
import { echapper } from './env';

export type Demande = { id: string; nom: string; email: string; telephone: string | null; prestation: string; description: string };
export type TypeReponse = 'prix' | 'appel' | 'questions';

const SIGNATURE = ['Valéry', 'Kov Atelier · Florange (Moselle), à côté du Luxembourg', 'kov-atelier.com'];
const prenom = (nom: string) => nom.trim().split(/\s+/)[0] ?? '';
const resume = (d: Demande) => (d.description.length > 160 ? `${d.description.slice(0, 157)}…` : d.description);

export function redigerReponse(type: TypeReponse, d: Demande, v: { prix?: string; delai?: string; creneau?: string; numero?: string; questions?: string }) {
  const bonjour = `Bonjour ${prenom(d.nom)},`;
  let sujet = '';
  let corps: string[] = [];
  if (type === 'prix') {
    sujet = `Votre devis Kov Atelier – ${d.id}`;
    corps = [
      bonjour,
      `Merci pour votre demande (${d.prestation}) : « ${resume(d)} ».`,
      `Après étude, voici ma proposition :\n• Prix : ${v.prix}\n• Délai : ${v.delai}`,
      'Si la pièce doit être expédiée, les frais de port vous seront précisés selon l’adresse de livraison.',
      'Pour lancer le projet, il suffit de répondre à cet e-mail pour valider le devis. Je reste disponible pour toute question ou ajustement.',
    ];
  } else if (type === 'appel') {
    sujet = `Votre projet Kov Atelier – ${d.id} : je vous appelle`;
    corps = [
      bonjour,
      `Merci pour votre demande (${d.prestation}). Pour bien cerner votre projet et vous faire une proposition juste, je préfère en parler de vive voix.`,
      v.numero
        ? `Je vous appellerai ${v.creneau} au ${v.numero}.`
        : `Je vous appellerai ${v.creneau}. Pourriez-vous me communiquer le numéro auquel vous joindre, en répondant à cet e-mail ?`,
      'Si ce créneau ne vous convient pas, répondez simplement à cet e-mail en m’indiquant vos disponibilités.',
    ];
  } else {
    sujet = `Votre demande Kov Atelier – ${d.id} : quelques précisions`;
    corps = [
      bonjour,
      `Merci pour votre demande (${d.prestation}). Pour vous établir un devis précis, j’aurais besoin de quelques précisions :`,
      v.questions ?? '',
      'Il vous suffit de répondre à cet e-mail. Des photos, un croquis coté ou un fichier 3D sont les bienvenus.',
    ];
  }
  corps.push('Bien cordialement,', SIGNATURE.join('\n'));
  return {
    subject: sujet,
    text: corps.join('\n\n'),
    html: `<div style="max-width:580px;font:15px/1.6 Arial,sans-serif;color:#20252B">${corps.map((p) => `<p style="white-space:pre-wrap">${echapper(p)}</p>`).join('')}</div>`,
  };
}
