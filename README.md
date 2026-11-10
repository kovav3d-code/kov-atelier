# Site Kov Atelier — guide de mise en ligne et de maintenance

Site vitrine et de demande de devis de Kov Atelier (Florange, Moselle).
Version 0.2, novembre 2026.

---

## 1. Ce que contient ce dossier

| Élément | Rôle |
|---|---|
| `src/pages/` | Les pages : accueil, services, réalisations, comment ça marche, devis, contact, mentions légales, confidentialité |
| `src/config/site.ts` | **Coordonnées de l'atelier** (téléphone, e-mail, fiche Google, clé Turnstile). Une valeur à `null` n'est jamais affichée |
| `src/config/services.ts` | **Textes des six services** (accueil + page Services) |
| `src/content/realisations/` | **Une réalisation = un fichier `.md`** (voir section 9) |
| `src/assets/realisations/` | Photos retouchées des réalisations |
| `src/styles/global.css` | Direction artistique (couleurs, typographie, mise en page) |
| `functions/` | Partie serveur : réception des devis et des messages, espace `/admin` |
| `schema.sql` | Structure de la base de données |
| `wrangler.toml` | Configuration Cloudflare (base, stockage, variables publiques) |

## 2. Architecture

- **Astro** génère un site statique : très rapide, bien référencé, sans base de données à maintenir pour les pages.
- **Cloudflare Pages** héberge le site et exécute la partie serveur (`functions/`).
- **Cloudflare R2** stocke les fichiers envoyés par les clients, en privé.
- **Cloudflare D1** conserve les demandes de devis, les messages et les compteurs de conversion.
- **Cloudflare Turnstile** protège les formulaires contre le spam.
- **Cloudflare Access** réserve l'espace `/admin` et les téléchargements à votre adresse e-mail.
- **Resend** envoie les e-mails de notification et de confirmation.

Aucune clé secrète n'est présente dans le code envoyé au navigateur : les secrets sont stockés chez Cloudflare.

## 3. Ce qui fonctionne et ce qui demande une action de votre part

| Fonction | État |
|---|---|
| Pages, navigation, affichage mobile, accessibilité clavier | ✅ Prêt |
| Formulaire de devis : validation, glisser-déposer, liste des fichiers, barre d'envoi | ✅ Prêt et testé |
| Contrôle des fichiers (extension, poids, contenu réel, exécutables déguisés refusés) | ✅ Prêt et testé |
| Enregistrement des demandes (D1) et des fichiers (R2) | ✅ Testé en local · ⚙️ ressources à créer sur votre compte |
| E-mail à l'atelier + confirmation au client | ⚙️ Clé Resend et domaine vérifié nécessaires |
| Antispam Turnstile | ⚙️ Clés à créer (piège à robots et délai minimal déjà actifs) |
| Espace `/admin` (liste des demandes, téléchargement des fichiers) | ⚙️ Cloudflare Access à configurer (refusé par défaut) |
| Formulaire de contact | ✅ Testé en local · ⚙️ mêmes réglages que le devis |
| Sitemap, robots.txt, balises SEO, Open Graph, données structurées | ✅ Prêt · ⚙️ adresse du site à renseigner |
| Compteurs de conversion (clics devis, formulaires commencés, envoyés) | ✅ Prêt, sans cookie |
| Mentions légales, politique de confidentialité | ✏️ Brouillons : informations administratives à compléter |
| Coordonnées (téléphone, e-mail, fiche Google) | ✏️ À renseigner dans `src/config/site.ts` |

**Sans ces réglages, le formulaire refuse les envois en production** (message « momentanément indisponible ») plutôt que de perdre une demande en silence.

## 4. Avant de commencer

- Un ordinateur avec **Node.js 20 ou plus récent** (nodejs.org).
- Un compte **GitHub** (gratuit), pour héberger le code et publier automatiquement.
- Un compte **Cloudflare** et un compte **Resend**.
- Un **nom de domaine** (ex. `kov-atelier.fr`), acheté chez Cloudflare ou un autre registraire.

Dans un terminal, depuis ce dossier :

```bash
npm install
npm run dev          # aperçu local sur http://localhost:4321
```

## 5. Mise en ligne pas à pas

### 5.1 Nom de domaine

Achetez le domaine puis ajoutez-le à Cloudflare (si vous l'avez acheté ailleurs, Cloudflare vous indique les serveurs DNS à renseigner chez votre registraire).

### 5.2 Base de données et stockage

```bash
npx wrangler login
npx wrangler d1 create kov-atelier
```

Copiez l'identifiant affiché (`database_id`) dans `wrangler.toml`, puis :

```bash
npx wrangler r2 bucket create kov-atelier-fichiers
npm run db:init:remote
```

### 5.3 Antispam Turnstile

Tableau de bord Cloudflare → **Turnstile** → **Ajouter un widget** → domaine du site.
- Clé du site (publique) → `turnstileSiteKey` dans `src/config/site.ts`.
- Clé secrète → secret `TURNSTILE_SECRET_KEY` (étape 5.6).

### 5.4 E-mails avec Resend

1. Sur resend.com, **Domains** → ajoutez votre domaine.
2. Ajoutez dans le DNS Cloudflare les enregistrements indiqués par Resend, puis attendez la validation.
3. **API Keys** → créez une clé → secret `RESEND_API_KEY` (étape 5.6).

### 5.5 Renseigner vos informations

- `astro.config.mjs` : `SITE_URL` = adresse définitive (ex. `https://www.kov-atelier.fr`).
- `wrangler.toml` : `SITE_URL`, `MAIL_FROM` (adresse sur le domaine vérifié chez Resend), `MAIL_ATELIER` (où vous recevez les demandes).
- `src/config/site.ts` : téléphone, e-mail, lien de la fiche Google, clé Turnstile.
- Pages légales : remplacez chaque zone surlignée `[…]`.

### 5.6 Créer le site sur Cloudflare Pages

1. Envoyez ce dossier sur un dépôt GitHub privé.
2. Cloudflare → **Workers & Pages** → **Créer** → **Pages** → **Connecter à Git** → choisissez le dépôt.
3. Commande de build : `npm run build` · Répertoire de sortie : `dist`.
4. La base D1, le stockage R2 et les variables sont lus depuis `wrangler.toml`.
5. **Paramètres** → **Variables et secrets** → ajoutez en type *Secret* : `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`.
6. **Domaines personnalisés** → ajoutez `kov-atelier.fr` (et redirigez `www.kov-atelier.fr` vers `kov-atelier.fr`).

Chaque modification envoyée sur GitHub republie le site automatiquement.

### 5.7 Protéger l'espace /admin

1. Cloudflare → **Zero Trust** → **Access** → **Applications** → **Ajouter** → *Self-hosted*.
2. Domaine : `kov-atelier.fr`, chemin : `admin`.
3. Règle : *Allow* → *Emails* → votre adresse.
4. Copiez le **Application Audience (AUD) Tag** → `ACCESS_AUD` dans `wrangler.toml`.
5. `ACCESS_TEAM_DOMAIN` = `votre-equipe.cloudflareaccess.com` (visible dans Zero Trust → Paramètres).

Vous accédez ensuite à `https://kov-atelier.fr/admin` après un code reçu par e-mail. Les liens de fichiers des e-mails de notification passent par cette protection.

### 5.8 Limiter les abus (recommandé)

Cloudflare → votre domaine → **Sécurité** → **WAF** → **Règles de limitation de débit** : par exemple 5 requêtes par minute et par adresse IP sur le chemin `/api/`.

## 6. Tests à faire après la mise en ligne

- [ ] Envoyer une demande de devis sans fichier, puis avec un STL et une photo depuis un téléphone (les fichiers doivent être joints à l’e-mail atelier si leur total ne dépasse pas 25 Mo).
- [ ] Vérifier la réception de l'e-mail atelier (lien vers les fichiers) et de la confirmation client (et les indésirables).
- [ ] Ouvrir `/admin` : la demande et ses fichiers apparaissent.
- [ ] Ouvrir `/admin` en navigation privée sans être connecté : accès refusé.
- [ ] Envoyer un message depuis la page Contact.
- [ ] Vérifier `https://kov-atelier.fr/sitemap-index.xml` et `/robots.txt`.

## 7. Google Search Console et Google Business Profile

### Search Console
1. search.google.com/search-console → **Ajouter une propriété** → type **Domaine**.
2. Ajoutez l'enregistrement TXT proposé dans le DNS Cloudflare, puis validez.
3. **Sitemaps** → soumettez `sitemap-index.xml`.

### Renseigner le site dans Google Business Profile
1. Connectez-vous avec le compte Google propriétaire de la fiche, puis recherchez « mon entreprise » sur Google (ou ouvrez la fiche dans Google Maps).
2. Cliquez sur **Modifier le profil** → **Coordonnées** → **Site Web**.
3. Collez l'adresse complète `https://kov-atelier.fr` puis **Enregistrer**. Google peut prendre quelques jours pour valider la modification.
4. Copiez le lien public de votre fiche et collez-le dans `googleBusinessUrl` (`src/config/site.ts`) : il apparaîtra sur la page Contact et dans les données structurées.

Le site et la fiche ne sont pas reliés automatiquement : c'est cette étape qui crée le lien. Gardez le même nom, la même ville et le même téléphone sur la fiche et sur le site.

## 8. Mesure d'audience

Le site compte, **sans cookie ni donnée personnelle** : les clics sur « Demander un devis » (avec l'emplacement du bouton), les formulaires commencés et les demandes réellement envoyées. Pour consulter les chiffres :

```bash
npx wrangler d1 execute kov-atelier --remote --command "SELECT nom, source, COUNT(*) AS total FROM evenements WHERE jour >= date('now','-30 day') GROUP BY nom, source ORDER BY total DESC"
```

Pour le nombre de visites, vous pouvez activer **Cloudflare Web Analytics** (sans cookie) dans le tableau de bord Pages.

## 9. Ajouter ou modifier une réalisation

1. Déposez la photo dans `src/assets/realisations/` (JPEG ou PNG, 1 600 px de large suffisent : le site crée lui-même les versions optimisées).
2. Créez un fichier dans `src/content/realisations/`, par exemple `support-capteur.md` :

```yaml
---
titre: Support de capteur pour convoyeur
categories: ["Pièces mécaniques", "Impression filament"]
nature: photo            # ou « rendu » pour une image de synthèse
photos:
  - src: ../../assets/realisations/support-capteur.jpg
    alt: Support imprimé fixé sur le châssis d’un convoyeur
typeProjet: Pièce technique sur mesure
besoin: Fixer un capteur sur un convoyeur sans percer le châssis.
solution: Support modélisé d’après les cotes relevées, imprimé en deux exemplaires.
technologie: Impression filament
miseEnAvant: true        # visible sur l'accueil (4 maximum)
ordre: 1
---
```

Catégories possibles : Pièces mécaniques, Prototypes, Impression résine, Impression filament, Conception 3D, Projets artistiques. Les champs `besoin`, `solution` et `technologie` sont facultatifs et ne s'affichent que s'ils sont remplis.

Les fichiers peuvent être modifiés directement sur GitHub depuis un navigateur : le site se republie seul.

## 10. RGPD et sécurité

- Base légale des formulaires : mesures précontractuelles. Aucun consentement n'est demandé, mais l'information figure sous chaque formulaire et dans la politique de confidentialité.
- Aucun cookie n'est déposé par le site. Turnstile est un dispositif de sécurité, mentionné dans la politique.
- Suppression des demandes de plus de 3 ans (à lancer une fois par an) :

```bash
npx wrangler d1 execute kov-atelier --remote --command "DELETE FROM demandes WHERE cree_le < date('now','-3 year'); DELETE FROM messages WHERE cree_le < date('now','-3 year')"
```

  Pensez à supprimer aussi les fichiers correspondants dans R2 (dossier `demandes/<référence>/`).
- **Pas d'antivirus intégré** : le contenu réel de chaque fichier est vérifié et les exécutables sont refusés, mais une archive ZIP peut contenir n'importe quoi. Ouvrez les ZIP avec prudence et analysez-les avec votre antivirus.

## 11. À fournir avant publication

- [x] Nom de domaine : kov-atelier.fr
- [x] E-mail de réception : kovav3d@gmail.com · [ ] téléphone professionnel
- [x] Lien de la fiche Google Business Profile
- [ ] Informations légales : exploitant, forme juridique, SIRET, adresse de domiciliation, TVA
- [ ] Pour chaque réalisation : besoin initial, solution apportée, technologie
- [ ] Confirmation des photos : réalisations de l'atelier, accord de la personne représentée sur le buste, droits sur le modèle du jeu d'échecs
