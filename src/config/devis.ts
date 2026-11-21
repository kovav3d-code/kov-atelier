/** Règles partagées par le formulaire (navigateur) et le serveur (Cloudflare Functions). */
export const PRESTATIONS = [
  { value: 'modelisation', label: 'Modélisation 3D' },
  { value: 'impression', label: 'Impression 3D' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'reproduction', label: 'Reproduction ou modification de pièce' },
  { value: 'composant', label: 'Support, gabarit, boîtier, outillage' },
  { value: 'artistique', label: 'Projet artistique ou sculpture' },
  { value: 'inconnu', label: 'Je ne sais pas encore' },
] as const;

export const DELAIS = ['Pas de délai particulier', 'Sous un mois', 'Sous deux semaines', 'Urgent'];
export const LIVRAISONS = ['La pièce fabriquée et livrée', 'Le fichier 3D seul (j’ai une imprimante ou un prestataire)', 'Je ne sais pas encore'];
export const BUDGETS = ['Moins de 30 €', '30 à 100 €', '100 à 300 €', '300 à 1 000 €', 'Plus de 1 000 €', 'Je ne sais pas encore'];

/** Questionnaire de qualification (page Devis) : 4 questions, puis orientation vers un appel ou le formulaire. */
export const PROFILS = ['Particulier', 'Professionnel'];
export const BESOINS_QUALIF = [
  { label: 'Une pièce cassée ou introuvable', prestation: 'reproduction' },
  { label: 'Un prototype', prestation: 'prototype' },
  { label: 'Une pièce technique (support, boîtier, gabarit)', prestation: 'composant' },
  { label: 'Un buste ou une sculpture', prestation: 'artistique' },
  { label: 'Un fichier 3D à créer ou à reprendre', prestation: 'modelisation' },
  { label: 'Autre chose', prestation: 'inconnu' },
] as const;
export const CRENEAUX = ['Le matin', 'En début d’après-midi', 'En fin de journée', 'Peu importe'];
export const BUDGET_MINIMUM = 'Moins de 30 €';

/** Dossier à traiter en priorité (proposition d'appel) : professionnel, budget de 300 € ou plus, ou buste et sculpture. */
export const estPrioritaire = (profil: string | null, budget: string | null, prestations: readonly string[]) =>
  profil === 'Professionnel' || budget === '300 à 1 000 €' || budget === 'Plus de 1 000 €' || prestations.includes('artistique');

export const FICHIERS = {
  extensions: ['stl', 'obj', 'step', 'stp', '3mf', 'pdf', 'jpg', 'jpeg', 'png', 'zip'],
  maxParFichier: 20 * 1024 * 1024, // 20 Mo
  maxTotal: 40 * 1024 * 1024,      // 40 Mo
  maxNombre: 10,
};

export const LIMITES = { nom: 120, entreprise: 120, email: 254, telephone: 30, description: 5000, court: 200 };

export const formatTaille = (o: number) =>
  o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;

/**
 * Rendez-vous téléphonique : créneaux de 15 min, du lundi au vendredi, 9 h–12 h et 14 h–18 h (heure de Paris),
 * sur les 5 prochains jours ouvrés. Jours fériés non exclus : l'atelier confirme chaque rendez-vous.
 */
export const APPEL = { plages: [[9, 12], [14, 18]] as const, pas: 15, jours: 5, delaiMinMin: 60 };

/** « 2026-11-24T10:15 » (heure de Paris) → libellé « mardi 24 novembre à 10 h 15 », ou null si invalide. */
export function rdvLibelle(v: string, maintenantParis?: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const [an, mo, j, h, mi] = m.slice(1).map(Number);
  const d = new Date(Date.UTC(an, mo - 1, j, h, mi));
  if (d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
  const jour = d.getUTCDay();
  if (jour === 0 || jour === 6) return null;
  if (mi % APPEL.pas) return null;
  const min = h * 60 + mi;
  if (!APPEL.plages.some(([a, b]) => min >= a * 60 && min < b * 60)) return null;
  if (maintenantParis) {
    const now = new Date(maintenantParis + 'Z').getTime();
    if (d.getTime() < now || d.getTime() > now + 16 * 864e5) return null;
  }
  const date = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d);
  return `${date} à ${h} h ${String(mi).padStart(2, '0')}`;
}

/** Heure actuelle à Paris au format « AAAA-MM-JJTHH:MM ». */
export function maintenantParis(date = new Date()): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
