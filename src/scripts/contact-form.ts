const form = document.getElementById('form-contact') as HTMLFormElement | null;
if (form) {
  const apercu = form.dataset.apercu === '1';
  const alerte = form.querySelector<HTMLElement>('.form-alert')!;
  const bouton = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const libelle = bouton.textContent ?? '';
  form.querySelector<HTMLInputElement>('[name="t0"]')!.value = String(Date.now());

  const erreur = (champ: string, msg: string) => {
    const z = document.getElementById(`ce-${champ}`); if (z) z.textContent = msg;
    const c = form.querySelector(`[name="${champ}"]`); if (c) msg ? c.setAttribute('aria-invalid', 'true') : c.removeAttribute('aria-invalid');
  };
  const alerter = (msg: string, info = false) => { alerte.textContent = msg; alerte.classList.toggle('is-info', info); alerte.hidden = false; };
  form.addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.name) erreur(t.name, ''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alerte.hidden = true;
    const fd = new FormData(form);
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    const err: Record<string, string> = {};
    if (v('nom').length < 2) err.nom = 'Indiquez votre nom et prénom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) err.email = 'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.';
    if (v('telephone') && !/^[+0-9 ().-]{6,30}$/.test(v('telephone'))) err.telephone = 'Utilisez uniquement des chiffres, des espaces et les signes + ( ) -.';
    if (v('message').length < 10) err.message = 'Votre message doit contenir au moins 10 caractères.';
    for (const k of ['nom', 'email', 'telephone', 'message']) erreur(k, err[k] ?? '');
    const premier = Object.keys(err)[0];
    if (premier) { form.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus(); return; }
    if (apercu) { alerter('Prévisualisation : cette page n’envoie aucune donnée. Sur le site en ligne, le message est transmis à l’atelier.', true); return; }
    if (form.querySelector('.cf-turnstile') && !fd.get('cf-turnstile-response')) { alerter('La vérification antispam n’est pas encore terminée. Patientez quelques secondes puis renvoyez.'); return; }

    bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
    try {
      const r = await fetch(form.action, { method: 'POST', body: fd });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string; erreurs?: Record<string, string> };
      if (r.ok && data.ok) {
        form.hidden = true;
        const res = document.getElementById('c-resultat')!; res.hidden = false; res.focus();
        return;
      }
      if (data.erreurs) for (const [k, m] of Object.entries(data.erreurs)) erreur(k, m);
      alerter(data.message ?? 'Le message n’a pas pu être envoyé. Vérifiez les champs signalés puis réessayez.');
    } catch {
      alerter('La connexion a été interrompue. Votre message est conservé : vérifiez votre connexion puis renvoyez.');
    }
    bouton.disabled = false; bouton.textContent = libelle;
    (window as any).turnstile?.reset?.();
  });
}
