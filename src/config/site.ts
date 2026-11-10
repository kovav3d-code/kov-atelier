/**
 * Informations de l'entreprise — SOURCE UNIQUE utilisée par tout le site.
 * Toute valeur à `null` est NON CONFIRMÉE : elle n'est affichée ni sur le site
 * ni dans les données structurées tant qu'elle n'est pas renseignée.
 */
export const SITE = {
  nom: 'Kov Atelier',
  ville: 'Florange',
  departement: 'Moselle',
  region: 'Grand Est',
  codePays: 'FR',
  zone: ['Florange', 'Thionville', 'Metz', 'Moselle', 'Luxembourg'],
  logiciels: ['SolidWorks', 'Shapr3D', 'Blender', 'ZBrush'],

  // ⚠️ À CONFIRMER avant publication
  telephone: null as string | null,         // ex. '+33 6 00 00 00 00'
  email: 'kovav3d@gmail.com' as string | null,
  googleBusinessUrl: 'https://maps.app.goo.gl/A63xX4MVkZPvfJw37' as string | null, // fiche Google Business Profile

  // Clé PUBLIQUE Cloudflare Turnstile (la clé secrète, elle, reste côté serveur)
  turnstileSiteKey: '0x4AAAAAAF68fViPVk21BOqh' as string | null,
};

export const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/comment-ca-marche', label: 'Comment ça marche' },
  { href: '/contact', label: 'Contact' },
];

/** Affiche les espaces réservés (« à confirmer ») en développement et dans la prévisualisation uniquement. */
export const APERCU = import.meta.env.PUBLIC_APERCU === '1';
export const MONTRER_RESERVES = import.meta.env.DEV || APERCU;
