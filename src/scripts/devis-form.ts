import { FICHIERS, formatTaille } from '../config/devis';
import { suivre } from './suivi';

const form = document.getElementById('form-devis') as HTMLFormElement | null;
if (form) initialiser(form);

function initialiser(form: HTMLFormElement) {
  const apercu = form.dataset.apercu === '1';
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const input = el<HTMLInputElement>('fichiers');
  const zone = el('dropzone');
  const liste = el('liste-fichiers');
  const total = el('total-fichiers');
  const alerte = el('alerte');
  const progression = el('progression');
  const bouton = el<HTMLButtonElement>('envoyer');
  const resultat = el('resultat');
  const libelleBouton = bouton.textContent ?? '';
  el<HTMLInputElement>('t0').value = String(Date.now());

  // Préselection depuis une page service : /devis?prestation=impression
  const pre = new URLSearchParams(location.search).get('prestation');
  if (pre) form.querySelector<HTMLInputElement>(`input[name="prestation"][value="${CSS.escape(pre)}"]`)?.click();

  // Plusieurs prestations possibles ; « Je ne sais pas encore » exclut les autres choix (et inversement).
  const cases = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="prestation"]'));
  for (const c of cases) c.addEventListener('change', () => {
    if (!c.checked) return;
    for (const autre of cases) if (autre !== c && (c.value === 'inconnu' || autre.value === 'inconnu')) autre.checked = false;
  });

  let fichiers: File[] = [];
  let commence = false;
  const ext = (n: string) => (n.includes('.') ? n.split('.').pop()!.toLowerCase() : '');
  const tailleTotale = () => fichiers.reduce((s, f) => s + f.size, 0);

  // ---- Suivi « formulaire commencé » + effacement des erreurs à la saisie
  form.addEventListener('input', (e) => {
    if (!commence) { commence = true; suivre('devis_commence'); }
    const t = e.target as HTMLInputElement;
    if (t.name && document.getElementById(`e-${t.name}`)?.textContent) afficherErreur(t.name, '');
  });

  // ---- Fichiers : sélection, glisser-déposer, liste
  function ajouter(nouveaux: FileList | File[]) {
    const erreurs: string[] = [];
    for (const f of Array.from(nouveaux)) {
      if (!FICHIERS.extensions.includes(ext(f.name))) { erreurs.push(`« ${f.name} » : format non accepté.`); continue; }
      if (f.size === 0) { erreurs.push(`« ${f.name} » est vide.`); continue; }
      if (f.size > FICHIERS.maxParFichier) { erreurs.push(`« ${f.name} » dépasse 20 Mo.`); continue; }
      if (fichiers.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (fichiers.length >= FICHIERS.maxNombre) { erreurs.push('10 fichiers maximum par demande.'); break; }
      if (tailleTotale() + f.size > FICHIERS.maxTotal) { erreurs.push(`« ${f.name} » ferait dépasser 40 Mo au total.`); continue; }
      fichiers.push(f);
    }
    afficherErreur('fichiers', erreurs.join(' '));
    rendreListe();
  }

  function rendreListe() {
    liste.replaceChildren(...fichiers.map((f, i) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      const badge = Object.assign(document.createElement('span'), { className: 'file-ext', textContent: ext(f.name).toUpperCase() });
      const nom = Object.assign(document.createElement('span'), { className: 'file-name', textContent: f.name, title: f.name });
      const taille = Object.assign(document.createElement('span'), { className: 'file-size', textContent: formatTaille(f.size) });
      const retirer = Object.assign(document.createElement('button'), { type: 'button', className: 'file-remove', textContent: 'Retirer' });
      retirer.setAttribute('aria-label', `Retirer ${f.name}`);
      retirer.addEventListener('click', () => { fichiers.splice(i, 1); afficherErreur('fichiers', ''); rendreListe(); input.focus(); });
      li.append(badge, nom, taille, retirer);
      return li;
    }));
    total.hidden = fichiers.length === 0;
    total.textContent = `${fichiers.length} fichier${fichiers.length > 1 ? 's' : ''} sélectionné${fichiers.length > 1 ? 's' : ''}, ${formatTaille(tailleTotale())} sur 40 Mo`;
  }

  input.addEventListener('change', () => { if (input.files?.length) ajouter(input.files); input.value = ''; });
  for (const t of ['dragenter', 'dragover']) zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.add('is-over'); });
  for (const t of ['dragleave', 'drop']) zone.addEventListener(t, (e) => { e.preventDefault(); zone.classList.remove('is-over'); });
  zone.addEventListener('drop', (e) => { const dt = (e as DragEvent).dataTransfer; if (dt?.files?.length) ajouter(dt.files); });
  // Un fichier lâché à côté de la zone ne doit pas ouvrir le fichier dans le navigateur
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  // ---- Validation
  function afficherErreur(champ: string, message: string) {
    const zoneErreur = document.getElementById(`e-${champ}`);
    if (zoneErreur) zoneErreur.textContent = message;
    const controle = champ === 'prestation' ? form.querySelector('[data-champ="prestation"]') : form.querySelector(`[name="${champ}"]:not([type="file"])`);
    if (controle) message ? controle.setAttribute('aria-invalid', 'true') : controle.removeAttribute('aria-invalid');
  }

  function valider(): boolean {
    const fd = new FormData(form);
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    const erreurs: Record<string, string> = {};
    if (!fd.getAll('prestation').length) erreurs.prestation = 'Choisissez au moins une prestation, ou « Je ne sais pas encore ».';
    if (v('description').length < 10) erreurs.description = 'Décrivez votre besoin en quelques mots (10 caractères minimum).';
    if (v('nom').length < 2) erreurs.nom = 'Indiquez votre nom et prénom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) erreurs.email = 'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.';
    if (v('telephone') && !/^[+0-9 ().-]{6,30}$/.test(v('telephone'))) erreurs.telephone = 'Utilisez uniquement des chiffres, des espaces et les signes + ( ) -.';
    for (const k of ['prestation', 'description', 'nom', 'email', 'telephone']) afficherErreur(k, erreurs[k] ?? '');
    const premier = Object.keys(erreurs)[0];
    if (premier) form.querySelector<HTMLElement>(`[name="${premier}"]`)?.focus();
    return !premier;
  }

  function alerter(message: string, info = false) {
    alerte.textContent = message;
    alerte.classList.toggle('is-info', info);
    alerte.hidden = false;
  }

  // ---- Envoi réel (aucune réussite simulée)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alerte.hidden = true;
    if (!valider()) return;
    if (apercu) {
      alerter('Prévisualisation : cette page n’envoie aucune donnée. Sur le site en ligne, ce bouton transmet la demande et les fichiers au serveur, puis affiche la confirmation avec la référence.', true);
      return;
    }
    const fd = new FormData(form);
    if (form.querySelector('.cf-turnstile') && !fd.get('cf-turnstile-response')) {
      alerter('La vérification antispam n’est pas encore terminée. Patientez quelques secondes puis renvoyez.');
      return;
    }
    fd.delete('fichiers');
    for (const f of fichiers) fd.append('fichiers', f, f.name);
    envoyer(fd);
  });

  function envoyer(fd: FormData) {
    bouton.disabled = true;
    bouton.textContent = fichiers.length ? 'Envoi des fichiers…' : 'Envoi en cours…';
    const barre = progression.firstElementChild as HTMLElement;
    progression.hidden = fichiers.length === 0;
    barre.style.width = '0%';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    xhr.responseType = 'json';
    xhr.timeout = 180_000;
    xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) barre.style.width = `${Math.round((ev.loaded / ev.total) * 100)}%`; };
    xhr.onload = () => {
      const r = (xhr.response ?? {}) as { ok?: boolean; reference?: string; confirmationEnvoyee?: boolean; message?: string; erreurs?: Record<string, string> };
      if (xhr.status >= 200 && xhr.status < 300 && r.ok && r.reference) return reussite(r.reference, String(fd.get('email')), !!r.confirmationEnvoyee);
      if (r.erreurs) for (const [k, m] of Object.entries(r.erreurs)) afficherErreur(k, m);
      echec(r.message ?? 'La demande n’a pas pu être envoyée. Vérifiez les champs signalés puis réessayez.');
    };
    xhr.onerror = xhr.ontimeout = () => echec('La connexion a été interrompue. Vos informations sont conservées : vérifiez votre connexion puis renvoyez.');
    xhr.send(fd);
  }

  function echec(message: string) {
    bouton.disabled = false;
    bouton.textContent = libelleBouton;
    progression.hidden = true;
    alerter(message);
    (window as any).turnstile?.reset?.();
  }

  function reussite(reference: string, email: string, confirmation: boolean) {
    el('r-ref').textContent = reference;
    el('r-email').textContent = email;
    el('r-conf-ok').hidden = !confirmation;
    el('r-conf-ko').hidden = confirmation;
    form.hidden = true;
    resultat.hidden = false;
    resultat.scrollIntoView({ behavior: 'smooth', block: 'center' });
    resultat.focus({ preventScroll: true });
  }
}
