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

export const DELAIS = ['Pas de délai particulier', 'Sous un mois', 'Sous deux semaines', 'Urgent (+40 €)'];
export const BUDGETS = ['Je ne sais pas encore', 'Moins de 100 €', '100 à 300 €', '300 à 1 000 €', 'Plus de 1 000 €'];

export const FICHIERS = {
  extensions: ['stl', 'obj', 'step', 'stp', '3mf', 'pdf', 'jpg', 'jpeg', 'png', 'zip'],
  maxParFichier: 20 * 1024 * 1024, // 20 Mo
  maxTotal: 40 * 1024 * 1024,      // 40 Mo
  maxNombre: 10,
};

export const LIMITES = { nom: 120, entreprise: 120, email: 254, telephone: 30, description: 5000, court: 200 };

export const formatTaille = (o: number) =>
  o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
