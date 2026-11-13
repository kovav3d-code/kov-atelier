/**
 * Les six prestations. Rédaction : le bénéfice client d'abord, la technique ensuite.
 * Modifier un texte ici met à jour l'accueil, la page Services et les données structurées.
 */
export const SERVICES = [
  {
    id: 'conception-modelisation-3d', prix: '49 €', prestation: 'modelisation', icon: 'modelisation',
    titre: 'Conception et modélisation 3D',
    resume: 'Votre croquis, votre plan ou votre idée devient un modèle 3D précis, prêt à être fabriqué ou transmis à un autre prestataire.',
    texte: 'Vous n’avez pas besoin de savoir dessiner en 3D. À partir de ce que vous avez sous la main, l’atelier construit un modèle numérique fidèle, que vous pouvez faire fabriquer ici ou ailleurs.',
    listes: [
      { titre: 'Vous pouvez partir de', items: ['un croquis à main levée ou un plan coté', 'des photos accompagnées de quelques mesures', 'une pièce existante', 'une simple description de votre besoin'] },
      { titre: 'Vous recevez', items: ['un fichier prêt pour l’impression 3D (STL, 3MF)', 'pour les pièces techniques, un format d’échange comme le STEP, selon ce qui est convenu'] },
    ],
    note: 'SolidWorks et Shapr3D pour les pièces mécaniques, Blender et ZBrush pour les formes libres.',
  },
  {
    id: 'impression-3d-sur-mesure', prix: '29 €', prestation: 'impression', icon: 'impression',
    titre: 'Impression 3D sur mesure',
    resume: 'La résine pour les détails fins, le filament pour les pièces robustes et économiques. Une pièce unique ou plusieurs exemplaires.',
    texte: 'Vous avez déjà un fichier, ou l’atelier le crée pour vous. La technologie d’impression est choisie selon l’usage de la pièce, pas l’inverse.',
    listes: [
      { titre: 'Impression résine', items: ['détails très fins et surfaces lisses', 'figurines, maquettes, bustes', 'petites pièces précises'] },
      { titre: 'Impression filament', items: ['pièces plus grandes et plus robustes', 'supports, boîtiers, gabarits', 'prototypes fonctionnels à moindre coût'] },
    ],
    note: 'Fichiers acceptés : STL, OBJ, 3MF ou STEP. Un fichier qui ne s’imprime pas correctement peut être corrigé.',
  },
  {
    id: 'prototypage', prix: '79 €', prestation: 'prototype', icon: 'prototype',
    titre: 'Prototypage',
    resume: 'Tester une forme, un assemblage ou un mécanisme en main avant d’engager une fabrication plus coûteuse.',
    texte: 'Un prototype permet de vérifier une idée concrètement : l’encombrement, l’assemblage avec l’existant, la prise en main ou le fonctionnement d’un mécanisme. Les ajustements entre deux versions se font directement dans le modèle 3D.',
    listes: [
      { titre: 'Pour quoi faire', items: ['vérifier qu’une pièce s’assemble avec l’existant', 'comparer plusieurs versions d’une forme', 'valider des dimensions avant usinage ou série', 'présenter un produit à un client ou à un partenaire'] },
    ],
    note: 'Pour les entrepreneurs et inventeurs : votre idée peut partir d’un simple croquis.',
  },
  {
    id: 'reproduction-modification', prix: '49 €', prestation: 'reproduction', icon: 'reproduction',
    titre: 'Reproduction et modification de pièces',
    resume: 'Une pièce cassée, introuvable ou plus fabriquée ? Elle est remodélisée à partir de l’original ou de photos, puis refabriquée.',
    texte: 'Clip cassé, pièce d’un appareil ancien, élément de machine qui n’est plus produit : quand une pièce manque, elle peut souvent être reproduite en impression 3D, à l’identique ou améliorée.',
    listes: [
      { titre: 'Comment ça se passe', items: ['les formes et les cotes sont relevées sur la pièce d’origine, ou d’après vos photos et mesures', 'la pièce est remodélisée, puis adaptée si besoin', 'elle est imprimée dans la technologie la plus adaptée à son usage'] },
      { titre: 'Fichiers 3D', items: ['correction d’un fichier qui ne s’imprime pas', 'réparation d’un maillage abîmé', 'modification ou adaptation d’un modèle existant'] },
    ],
    note: 'La faisabilité dépend des contraintes de la pièce (efforts, chaleur, frottement) : elle est étudiée avant tout devis.',
  },
  {
    id: 'composants-techniques', prix: '39 €', prestation: 'composant', icon: 'composant',
    titre: 'Composants techniques',
    resume: 'Supports, gabarits, boîtiers, outillages : des pièces fonctionnelles adaptées à votre machine, votre véhicule ou votre poste de travail.',
    texte: 'Les pièces qui rendent service au quotidien, dessinées pour votre situation précise plutôt que choisies dans un catalogue.',
    listes: [
      { titre: 'Exemples', items: ['gabarits de perçage, de montage ou de contrôle', 'supports et fixations (capteur, caméra, outil)', 'boîtiers pour carte électronique', 'caches, entretoises, guides', 'outillages d’atelier'] },
    ],
    note: 'Professionnels : vos plans PDF ou fichiers STEP peuvent être joints directement à la demande de devis.',
  },
  {
    id: 'modelisation-artistique', prix: '99 €', prestation: 'artistique', icon: 'artistique',
    titre: 'Modélisation artistique et organique',
    resume: 'Sculpture numérique, bustes, objets décoratifs et créations personnalisées, du modèle à la pièce finie.',
    texte: 'Pour les formes que les logiciels de mécanique dessinent mal : visages, personnages, ornements, objets décoratifs. Le modèle est sculpté numériquement, puis imprimé, en résine lorsque les détails fins l’exigent.',
    listes: [
      { titre: 'Exemples', items: ['bustes et portraits en sculpture numérique', 'personnages et figurines originaux', 'objets décoratifs et cadeaux personnalisés', 'éléments organiques pour maquettes ou décors'] },
    ],
    note: 'Sculpture numérique dans ZBrush et Blender.',
  },
] as const;
