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
import pignonAvantApres from '../assets/realisations/pignon-avant-apres.jpg';
import mosqueeHassan from '../assets/realisations/maquette-mosquee-hassan-ii.jpg';
import mosqueeBrunei from '../assets/realisations/maquette-mosquee-brunei.jpg';
import potsOursin from '../assets/realisations/pots-oursin.jpg';
import potsOursinSuspendus from '../assets/realisations/pots-oursin-suspendus.jpg';
import sculptureAjouree from '../assets/realisations/sculpture-organique-ajouree.jpg';
import dioramaOrganique from '../assets/realisations/diorama-organique.jpg';
import plaqueRelief from '../assets/realisations/plaque-relief-resine.jpg';
import chatArticule from '../assets/realisations/chat-articule.jpg';

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
  categorie: 'Pièces techniques' | 'Sculptures et figurines';
  video?: { mp4: string; poster: string };
};

export const MODELES: Modele3D[] = [
  { id: 'buste-portrait', titre: 'Buste portrait', legende: 'Sculpture numérique, impression résine', categorie: 'Sculptures et figurines', alt: 'Rotation à 360° d’un buste d’homme sculpté en 3D, barbe courte et chemise à col', video: { mp4: '/videos/modeles/buste-portrait-360.mp4', poster: '/videos/modeles/buste-portrait-360.jpg' } },
  { id: 'contenant-filete', titre: 'Contenant fileté à anse', legende: 'Assemblage de cinq pièces : corps, socle à robinet, bouchon, anse et molette', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un contenant cylindrique avec bouchon à anse et molette latérale', video: { mp4: '/videos/modeles/contenant-filete-360.mp4', poster: '/videos/modeles/contenant-filete-360.jpg' } },
  { id: 'pignon-aspirateur', titre: 'Pignon de remplacement pour aspirateur robot', legende: 'Pièce introuvable remodélisée', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un pignon denté avec moyeu central', video: { mp4: '/videos/modeles/pignon-aspirateur-360.mp4', poster: '/videos/modeles/pignon-aspirateur-360.jpg' } },
  { id: 'clip-coffre', titre: 'Clip de coffre pour voiture ancienne', legende: 'Reproduction d’une pièce d’époque', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un clip arrondi à embase', video: { mp4: '/videos/modeles/clip-coffre-360.mp4', poster: '/videos/modeles/clip-coffre-360.jpg' } },
  { id: 'boitier-ecran', titre: 'Boîtier support d’écran', legende: 'Conception sur mesure, découpes et fixations', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un boîtier rectangulaire ouvert avec découpes latérales', video: { mp4: '/videos/modeles/boitier-ecran-360.mp4', poster: '/videos/modeles/boitier-ecran-360.jpg' } },
  { id: 'bouchon-parfum', titre: 'Bouchon de flacon de parfum', legende: 'Design sur mesure', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un bouchon de parfum cubique aux arêtes arrondies', video: { mp4: '/videos/modeles/bouchon-parfum-360.mp4', poster: '/videos/modeles/bouchon-parfum-360.jpg' } },
  { id: 'angle-fenetre', titre: 'Angle de fenêtre', legende: 'Pièce de remplacement', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’une pièce d’angle de fenêtre', video: { mp4: '/videos/modeles/angle-fenetre-360.mp4', poster: '/videos/modeles/angle-fenetre-360.jpg' } },
  { id: 'anneau-spot', titre: 'Anneau de fixation pour spot', legende: 'Présenté avec ses supports d’impression', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un anneau de fixation de spot entouré de ses supports d’impression', video: { mp4: '/videos/modeles/anneau-spot-360.mp4', poster: '/videos/modeles/anneau-spot-360.jpg' } },
  { id: 'chat-articule', titre: 'Chat articulé', legende: 'Figurine articulée, imprimée en filament', categorie: 'Sculptures et figurines', alt: 'Rotation à 360° d’un chat articulé au large sourire, assis, bras le long du corps', video: { mp4: '/videos/modeles/chat-articule-360.mp4', poster: '/videos/modeles/chat-articule-360.jpg' } },
  { id: 'masque-sculpte', titre: 'Masque sculpté sur mesure', legende: 'Sculpté sur le scan 3D d’un visage', categorie: 'Sculptures et figurines', alt: 'Rotation à 360° d’un masque couvrant le bas du visage, mâchoire aux crocs apparents', video: { mp4: '/videos/modeles/masque-sculpte-360.mp4', poster: '/videos/modeles/masque-sculpte-360.jpg' } },
  { id: 'trophee-challenge', titre: 'Socle de trophée gravé', legende: 'Trophée sur mesure, gravure en relief', categorie: 'Pièces techniques', alt: 'Rotation à 360° d’un socle de trophée à pans coupés, gravé « Challenge Focus Cup »', video: { mp4: '/videos/modeles/trophee-challenge-360.mp4', poster: '/videos/modeles/trophee-challenge-360.jpg' } },
  {
    id: 'creature-biomecanique',
    titre: 'Créature biomécanique',
    legende: 'Sculpture numérique (ZBrush)',
    categorie: 'Sculptures et figurines',
    alt: 'Rotation à 360° d’une créature biomécanique sculptée en 3D, cage thoracique apparente et longs membres recourbés',
    video: { mp4: '/videos/creature-360.mp4', poster: '/videos/creature-360-poster.jpg' },
  },
];

export type MediaAtelier =
  | { type: 'photo'; src: ImageMetadata; alt: string; legende: string }
  | { type: 'video'; mp4: string; poster: string; alt: string; legende: string };

/** Photos et vidéos de pièces réelles : impressions, finitions, pièces montées. */
export const ATELIER: MediaAtelier[] = [
  { type: 'photo', src: pignonAvantApres, alt: 'Dans une main, le pignon d’origine usé et noirci à côté de la pièce de remplacement imprimée en gris', legende: 'Pignon d’aspirateur robot : l’original usé, la pièce refaite' },
  { type: 'photo', src: busteExterieur, alt: 'Buste imprimé en 3D d’un homme à lunettes et barbe courte, finition noir brillant, photographié en extérieur', legende: 'Buste portrait, finition noir brillant' },
  { type: 'photo', src: mosqueeHassan, alt: 'Maquette imprimée de la mosquée Hassan II de Casablanca, minaret détaillé et toits verts', legende: 'Maquette de la mosquée Hassan II' },
  { type: 'photo', src: potsOursin, alt: 'Deux pots en forme d’oursin imprimés en résine, l’un peint en bleu patiné avec une plante, l’autre brut tenu en main', legende: 'Pots oursins, brut et peint' },
  { type: 'video', mp4: '/videos/atelier/masque-imprime.mp4', poster: '/videos/atelier/masque-imprime.jpg', alt: 'Vidéo d’un masque imprimé en résine noire brillante, tenu en main et tourné pour montrer ses reliefs', legende: 'Masque imprimé, finition noir brillant' },
  { type: 'photo', src: sculptureAjouree, alt: 'Sculpture organique ajourée imprimée en résine grise, surfaces texturées et épines', legende: 'Sculpture organique ajourée, résine' },
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
  { type: 'video', mp4: '/videos/atelier/masque-sculpture-zbrush.mp4', poster: '/videos/atelier/masque-sculpture-zbrush.jpg', alt: 'Vidéo du masque en cours de sculpture dans ZBrush, ajusté sur le scan 3D d’un visage', legende: 'Le même masque, sculpté sur un scan de visage' },
  { type: 'photo', src: mosqueeBrunei, alt: 'Maquette imprimée de la mosquée Omar Ali Saifuddien, coupole dorée et barque royale', legende: 'Maquette de la mosquée Omar Ali Saifuddien' },
  { type: 'photo', src: chatArticule, alt: 'Chat articulé imprimé en filament aux reflets cuivrés, tenu en main', legende: 'Chat articulé, filament cuivré' },
  { type: 'photo', src: dioramaOrganique, alt: 'Socle de diorama organique imprimé en résine grise, épines et sphères', legende: 'Socle de diorama organique' },
  { type: 'photo', src: potsOursinSuspendus, alt: 'Deux pots oursins suspendus, rose et bleu, avec des plantes retombantes', legende: 'Pots oursins suspendus, en situation' },
  { type: 'photo', src: plaqueRelief, alt: 'Plaque sculptée en relief organique imprimée en résine grise, posée sur un tapis de découpe', legende: 'Plaque sculptée en relief, résine' },
];
