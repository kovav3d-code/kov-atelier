// Page Réalisations : modèles 3D (rotation 360° en boucle) et photos / vidéos prises à l'atelier.
import type { ImageMetadata } from 'astro';
import adaptateur from '../assets/realisations/adaptateur-crosse-pliante.jpg';
import aladdins from '../assets/realisations/aladdins-watches.jpg';
import busteExterieur from '../assets/realisations/buste-imprime-exterieur.jpg';
import busteStudio from '../assets/realisations/buste-imprime-studio.jpg';
import conteneurGris from '../assets/realisations/conteneur-gris.jpg';
import conteneurNoir from '../assets/realisations/conteneur-noir.jpg';
import echecsResine from '../assets/realisations/echecs-resine.jpg';
import echecsPlateau from '../assets/realisations/echecs-plateau.jpg';
import figurineFace from '../assets/realisations/figurine-resine-face.jpg';
import figurineDetail from '../assets/realisations/figurine-resine-detail.jpg';
import figurineDos from '../assets/realisations/figurine-resine-dos.jpg';
import masqueAtelier from '../assets/realisations/masque-atelier.jpg';
import piecesResine from '../assets/realisations/pieces-resine.jpg';
import piecesResineMain from '../assets/realisations/pieces-resine-main.jpg';
import plaquesQr from '../assets/realisations/plaques-qr.jpg';
import trophee from '../assets/realisations/trophee-immo.jpg';

/**
 * Modèle 3D affiché en rotation continue.
 * - `fichier` : modèle allégé pour le web, dans public/modeles/ (.glb de préférence, ou .stl).
 * - `video`   : à défaut, une vidéo de rotation à 360° déjà rendue (public/videos/).
 */
export type Modele3D = {
  id: string;
  titre: string;
  legende?: string;
  alt: string;
  fichier?: string;
  couleur?: string; // couleur du matériau pour un .stl (sans couleur propre)
  video?: { mp4: string; poster: string };
};

export const MODELES: Modele3D[] = [
  {
    id: 'creature-biomecanique',
    titre: 'Créature biomécanique',
    legende: 'Sculpture numérique (ZBrush)',
    alt: 'Rotation à 360° d’une créature biomécanique sculptée en 3D, cage thoracique apparente et longs membres recourbés',
    video: { mp4: '/videos/creature-360.mp4', poster: '/videos/creature-360-poster.jpg' },
  },
];

export type MediaAtelier =
  | { type: 'photo'; src: ImageMetadata; alt: string; legende: string }
  | { type: 'video'; mp4: string; poster: string; alt: string; legende: string };

/** Photos et vidéos de pièces réelles : impressions, finitions, pièces montées. */
export const ATELIER: MediaAtelier[] = [
  { type: 'photo', src: busteExterieur, alt: 'Buste imprimé en 3D d’un homme à lunettes et barbe courte, finition noir brillant, photographié en extérieur', legende: 'Buste portrait, finition noir brillant' },
  { type: 'photo', src: figurineFace, alt: 'Figurine Golden Reaper imprimée en résine translucide, vue de face sur son socle', legende: 'Golden Reaper, résine translucide' },
  { type: 'photo', src: echecsResine, alt: 'Pièces d’échecs imprimées en résine grise, détails des armures et des socles, sur un échiquier en verre', legende: 'Jeu d’échecs en résine' },
  { type: 'photo', src: adaptateur, alt: 'Crosse noire montée sur un adaptateur pliant imprimé en 3D, avec bouton de verrouillage strié et platine à deux trous', legende: 'Adaptateur de crosse pliante' },
  { type: 'photo', src: masqueAtelier, alt: 'Poste de travail de l’atelier, un masque en cours de sculpture sur tablette graphique, logiciel 3D sur un second écran', legende: 'À l’atelier : sculpture d’un masque' },
  { type: 'photo', src: piecesResineMain, alt: 'Pièce organique imprimée en résine tenue en main, détail des écailles et des pointes', legende: 'Pièce organique, détail des écailles' },
  { type: 'photo', src: trophee, alt: 'Trophée noir aux lignes d’immeubles stylisées, socle gravé au nom de l’agence', legende: 'Trophée sur mesure pour une agence' },
  { type: 'photo', src: figurineDetail, alt: 'Détail d’une impression en résine translucide, visage, ailes et attaches', legende: 'Détail d’impression résine' },
  { type: 'photo', src: conteneurGris, alt: 'Maquette de conteneur aménagé avec enseigne, version brute', legende: 'Maquette de conteneur, version brute' },
  { type: 'photo', src: conteneurNoir, alt: 'La même maquette de conteneur en version noire, enseigne en relief', legende: 'Maquette de conteneur, version finie' },
  { type: 'photo', src: busteStudio, alt: 'Buste imprimé en 3D d’un homme barbu, finition noir brillant, vu de trois quarts sur fond clair', legende: 'Buste portrait, vue de trois quarts' },
  { type: 'photo', src: aladdins, alt: 'Présentoir à montres personnalisé surmonté d’une figurine, plaque gravée', legende: 'Présentoir à montres personnalisé' },
  { type: 'photo', src: echecsPlateau, alt: 'Jeu d’échecs complet en résine grise disposé sur un plateau en verre', legende: 'L’échiquier complet' },
  { type: 'photo', src: piecesResine, alt: 'Trois queues à écailles et pointes et un socle à gueule ouverte, imprimés en résine grise', legende: 'Pièces organiques en résine' },
  { type: 'photo', src: figurineDos, alt: 'Golden Reaper en résine translucide vu de dos, ailes déployées', legende: 'Golden Reaper, vue de dos' },
  { type: 'photo', src: plaquesQr, alt: 'Deux plaques imprimées avec QR code en relief', legende: 'Plaques QR code en relief' },
];
