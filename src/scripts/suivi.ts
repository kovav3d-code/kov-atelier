/** Envoie un événement de conversion anonyme (aucun cookie, aucun identifiant). */
export function suivre(nom: 'devis_clic' | 'devis_commence', source?: string) {
  if ((window as any).KOV_APERCU) return; // prévisualisation : aucun envoi
  try {
    const corps = JSON.stringify({ e: nom, s: source ?? null, p: location.pathname });
    navigator.sendBeacon?.('/api/evenement', new Blob([corps], { type: 'application/json' }));
  } catch { /* la mesure ne doit jamais gêner la navigation */ }
}
