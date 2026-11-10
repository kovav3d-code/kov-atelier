import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const CATEGORIES = [
  'Pièces mécaniques',
  'Prototypes',
  'Impression résine',
  'Impression filament',
  'Conception 3D',
  'Projets artistiques',
] as const;

/**
 * Une réalisation = un fichier Markdown dans src/content/realisations/
 * + ses photos dans src/assets/realisations/. Le site se met à jour tout seul.
 * Les champs besoin / solution / technologie ne s'affichent que s'ils sont remplis.
 */
const realisations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/realisations' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      categories: z.array(z.enum(CATEGORIES)).min(1),
      photos: z.array(z.object({ src: image(), alt: z.string() })).min(1),
      nature: z.enum(['photo', 'rendu']).optional(), // « rendu » = image de synthèse, pas une photo de pièce fabriquée
      ajustement: z.enum(['cover', 'contain']).default('cover'),
      typeProjet: z.string().optional(),
      besoin: z.string().optional(),
      solution: z.string().optional(),
      technologie: z.string().optional(),
      miseEnAvant: z.boolean().default(false),
      ordre: z.number().default(100),
      aConfirmer: z.boolean().default(false), // repère interne : informations à valider par l'atelier
    }),
});

export const collections = { realisations };
