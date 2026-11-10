/**
 * Grille de la SUGGESTION DE PRIX affichée dans Telegram (indicative, jamais envoyée au client).
 * Valeurs de départ à ajuster selon les vrais tarifs de l'atelier. Montants en euros.
 */
export const TARIFS = {
  minimumCommande: 30,
  /** Forfaits de conception selon la prestation cochée : [bas, haut]. */
  conception: {
    modelisation: [80, 250],   // modélisation 3D, complexité inconnue → fourchette « moyenne »
    prototype: [120, 350],     // conception + itération
    reproduction: [70, 220],   // relevés, rétro-ingénierie
    composant: [50, 160],      // support, gabarit, boîtier, outillage
    artistique: [150, 500],    // sculpture numérique (ZBrush / Blender)
    inconnu: [60, 250],
  } as Record<string, [number, number]>,
  /** Impression : prix au cm³ de pièce + forfait de préparation (orientation, supports, post-traitement). */
  impression: {
    resine: { parCm3: [0.8, 1.6], preparation: 15 },
    filament: { parCm3: [0.25, 0.5], preparation: 10 },
  },
  /** Taux de remplissage supposé quand le volume vient des dimensions (pas de STL). */
  remplissageEstime: 0.3,
  /** Majorations selon le délai demandé : montant fixe (plus) et/ou coefficient (fois). */
  delai: { 'Urgent (+40 €)': { plus: 40 }, 'Sous deux semaines': { fois: 1.1 } } as Record<string, { plus?: number; fois?: number }>,
};
