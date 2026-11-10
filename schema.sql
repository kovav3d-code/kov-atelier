-- Base D1 « kov-atelier » : demandes de devis et compteurs de conversion.
CREATE TABLE IF NOT EXISTS demandes (
  id TEXT PRIMARY KEY,                 -- référence communiquée au client, ex. KOV-261110-ABCD
  cree_le TEXT NOT NULL,
  nom TEXT NOT NULL,
  entreprise TEXT,
  email TEXT NOT NULL,
  telephone TEXT,
  prestation TEXT NOT NULL,
  description TEXT NOT NULL,
  dimensions TEXT,
  quantite TEXT,
  materiau TEXT,
  delai TEXT,
  budget TEXT,
  fichiers TEXT NOT NULL DEFAULT '[]', -- JSON : [{cle, nom, taille}]
  statut TEXT NOT NULL DEFAULT 'nouvelle',
  email_atelier_envoye INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demandes_date ON demandes (cree_le);

CREATE TABLE IF NOT EXISTS evenements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jour TEXT NOT NULL,   -- AAAA-MM-JJ, aucune heure précise
  nom TEXT NOT NULL,    -- devis_clic | devis_commence | devis_envoye
  source TEXT,          -- emplacement du bouton, ou type de prestation
  page TEXT
);
CREATE INDEX IF NOT EXISTS idx_evenements ON evenements (jour, nom);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  cree_le TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  message TEXT NOT NULL,
  email_atelier_envoye INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages (cree_le);
