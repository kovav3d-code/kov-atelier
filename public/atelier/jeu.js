// Planète Kov : petite planète jouable de l'atelier (création originale, aucune ressource externe).
// Principe : le personnage reste au sommet de la planète, c'est la planète qui tourne sous ses pas.
// Rendu « dessin animé » : matériaux à paliers (toon) et contours par coque inversée.
import * as THREE from '/vendor/three/three.module.min.js';

const STATIONS = JSON.parse(document.getElementById('stations').textContent);
const cv = document.getElementById('scene');
const R = 12;                                  // rayon de la planète
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); }
catch (e) { document.body.classList.add('sans-3d'); document.querySelector('.liste').classList.remove('sr'); document.getElementById('chargement').classList.add('fini'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#EFE6D2');
scene.fog = new THREE.Fog('#EFE6D2', 26, 46);
const cam = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

// Lumières : soleil chaud qui porte les ombres, ciel doux
const soleil = new THREE.DirectionalLight('#fff4e2', 2.4);
soleil.position.set(-8, 30, 12); soleil.castShadow = true;
soleil.shadow.mapSize.set(1024, 1024);
Object.assign(soleil.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
soleil.shadow.bias = -0.0008; soleil.shadow.normalBias = 0.03;
scene.add(soleil, soleil.target); soleil.target.position.set(0, R, 0);
scene.add(new THREE.HemisphereLight('#ffffff', '#c9b48e', 1.25));

// Matériau dessin animé : 3 paliers de lumière
const paliers = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
paliers.minFilter = paliers.magFilter = THREE.NearestFilter; paliers.needsUpdate = true;
const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: paliers, ...o });
const encre = new THREE.MeshBasicMaterial({ color: '#20252B', side: THREE.BackSide });
function contour(mesh, e = 0.06) {
  const c = new THREE.Mesh(mesh.geometry, encre);
  c.scale.setScalar(1 + e / Math.max(0.2, mesh.geometry.boundingSphere?.radius || 1));
  mesh.add(c); return mesh;
}
function M(geo, couleur, { ombre = true, trait = 0.05, o } = {}) {
  geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, toon(couleur, o)); m.castShadow = ombre; m.receiveShadow = true;
  if (trait) contour(m, trait); return m;
}

// ---- La planète : un plateau d'impression arrondi, quadrillé comme un sous-main
const planete = new THREE.Group(); scene.add(planete);
const tex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#E3CFA6'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(92,77,58,.10)' : 'rgba(255,255,255,.18)'; x.fillRect(Math.random() * 256 | 0, Math.random() * 256 | 0, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 5); t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter; return t;
})();
const sol = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), toon('#ffffff', { map: tex }));
sol.receiveShadow = true; planete.add(sol);
const bord = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 64, 48), encre); planete.add(bord);

// Pose un objet sur la planète à (latitude, longitude) en degrés, tourné de « cap » degrés
function poser(obj, lat, lon, cap = 0) {
  const g = new THREE.Group();
  const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon);
  const n = new THREE.Vector3(Math.sin(phi) * Math.sin(th), Math.cos(phi), Math.sin(phi) * Math.cos(th));
  g.position.copy(n).multiplyScalar(R);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  obj.rotation.y = THREE.MathUtils.degToRad(cap);
  g.add(obj); planete.add(g); return g;
}

// Panneau avec texte (police pixel) ou image
function panneau(titre, sous, { l = 3.4, h = 2, image, fond = '#20252B', texte = '#F7F8F6' } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / l); const x = c.getContext('2d');
  x.fillStyle = fond; x.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const ecrire = () => {
    x.fillStyle = fond; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#D9C3A0'; x.fillRect(0, 0, c.width, 10);
    x.fillStyle = texte; x.font = '44px Silkscreen, monospace'; x.textBaseline = 'top';
    let y = 34; for (const ligne of titre.split('\n')) { x.fillText(ligne, 26, y); y += 52; }
    if (sous) { x.fillStyle = '#D9C3A0'; x.font = '22px "Geist Mono", monospace'; for (const ligne of sous.split('\n')) { x.fillText(ligne, 26, y + 10); y += 30; } }
    t.needsUpdate = true;
  };
  if (image) { const im = new Image(); im.onload = () => { x.drawImage(im, 0, 0, c.width, c.height); t.needsUpdate = true; }; im.src = image; }
  else document.fonts.load('44px Silkscreen').then(ecrire, ecrire), ecrire();
  const g = new THREE.Group();
  const plaque = M(new THREE.BoxGeometry(l, h, 0.12), '#20252B', { trait: 0.04 });
  plaque.position.y = h / 2 + 1.1; g.add(plaque);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(l * 0.94, h * 0.9), new THREE.MeshBasicMaterial({ map: t }));
  face.position.set(0, h / 2 + 1.1, 0.065); g.add(face);
  for (const s of [-1, 1]) { const p = M(new THREE.BoxGeometry(0.14, 1.2, 0.14), '#C9A97A'); p.position.set(s * l * 0.38, 0.6, -0.02); g.add(p); }
  return g;
}

// ---- Décor : arbres « imprimés » (couches empilées) et bobines de filament
const COULEURS = ['#2864DC', '#E8743B', '#5BB27A', '#F2C14E', '#8FB0F5'];
function arbre(c) {
  const g = new THREE.Group(); const tronc = M(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8), '#8C6A45'); tronc.position.y = 0.4; g.add(tronc);
  for (let i = 0; i < 5; i++) { const r = 0.75 - i * 0.13; const k = M(new THREE.CylinderGeometry(r * 0.92, r, 0.24, 18), c, { trait: 0.035 }); k.position.y = 0.95 + i * 0.25; g.add(k); }
  return g;
}
function bobine(c) {
  const g = new THREE.Group();
  const fil = M(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 24), c); fil.rotation.x = Math.PI / 2; fil.position.y = 0.5; g.add(fil);
  for (const z of [-0.2, 0.2]) { const f = M(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 24), '#20252B', { trait: 0 }); f.rotation.x = Math.PI / 2; f.position.set(0, 0.5, z); g.add(f); }
  return g;
}
const alea = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
for (let i = 0; i < 26; i++) {
  const lat = -70 + alea() * 140, lon = alea() * 360;
  if (Math.abs(lat - 90) < 14) continue;
  poser(i % 3 ? arbre(COULEURS[i % COULEURS.length]) : bobine(COULEURS[(i + 2) % COULEURS.length]), lat, lon, alea() * 360).scale.setScalar(0.8 + alea() * 0.5);
}

// ---- Stations
const anim = [];               // fonctions appelées à chaque image
const points = [];             // { id, monde } pour la proximité
function station(id, lat, lon, cap, objet) {
  const g = poser(objet, lat, lon, cap); points.push({ id, g, ...STATIONS.find((s) => s.id === id) });
}

// Accueil : grand panneau
station('accueil', 62, 0, 180, panneau('KOV ATELIER', 'Bienvenue sur la planète\nde l’atelier. Approchez\nles stations pour visiter.', { l: 4.2, h: 2.4 }));

// Imprimante résine : socle sombre, capot orange, plateau qui monte et descend
{
  const g = new THREE.Group();
  const socle = M(new THREE.BoxGeometry(1.8, 0.9, 1.6), '#2B3036'); socle.position.y = 0.45; g.add(socle);
  const ecran = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.32), new THREE.MeshBasicMaterial({ color: '#8FB0F5' })); ecran.position.set(0, 0.5, 0.81); g.add(ecran);
  const bac = M(new THREE.BoxGeometry(1.3, 0.16, 1.1), '#3FD3D8', { o: { transparent: true, opacity: 0.85 } }); bac.position.y = 0.98; g.add(bac);
  const axe = M(new THREE.BoxGeometry(0.18, 2.2, 0.18), '#89939C'); axe.position.set(0, 2, -0.55); g.add(axe);
  const plateau = M(new THREE.BoxGeometry(1.1, 0.1, 0.9), '#B8C0C8'); g.add(plateau);
  const piece = M(new THREE.CylinderGeometry(0.22, 0.3, 0.6, 12), '#9FF7F7', { o: { transparent: true, opacity: 0.85 } }); g.add(piece);
  const capot = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 1.5), new THREE.MeshToonMaterial({ color: '#F08A24', gradientMap: paliers, transparent: true, opacity: 0.38, depthWrite: false }));
  capot.position.y = 2.05; g.add(capot);
  anim.push((t) => { const y = 1.4 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 1.3; plateau.position.y = y; piece.position.y = y - 0.35; });
  const p = panneau('IMPRESSION', 'Résine et filament', { l: 2.4, h: 1.1 }); p.position.set(2.1, 0, 0.3); p.rotation.y = -0.4; g.add(p);
  station('impression', 30, 300, 40, g);
}

// Galerie : chevalets avec de vrais rendus de l'atelier
{
  const g = new THREE.Group();
  const IM = ['/videos/modeles/sculpture-cthulhu-360.jpg', '/videos/modeles/buste-portrait-360.jpg', '/videos/modeles/masque-sculpte-360.jpg'];
  IM.forEach((src, i) => { const c = panneau('', '', { l: 1.5, h: 1.5, image: src }); c.position.set((i - 1) * 1.75, 0, Math.abs(i - 1) * 0.35); c.rotation.y = (1 - i) * 0.25; g.add(c); });
  const titre = panneau('GALERIE', 'Bustes et sculptures', { l: 2.4, h: 1.1 }); titre.position.set(0, 2.6, -0.4); titre.scale.setScalar(0.7); g.add(titre);
  station('sculptures', 32, 60, -40, g);
}

// Établi : table et engrenages qui tournent
{
  const g = new THREE.Group();
  const table = M(new THREE.BoxGeometry(2.6, 0.16, 1.3), '#B98A5A'); table.position.y = 1; g.add(table);
  for (const [x, z] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]]) { const p = M(new THREE.BoxGeometry(0.14, 1, 0.14), '#8C6A45'); p.position.set(x, 0.5, z); g.add(p); }
  function engrenage(r, dents, c) {
    const s = new THREE.Shape();
    for (let i = 0; i < dents * 2; i++) { const a = (i / (dents * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.22; const a2 = a + Math.PI / (dents * 2);
      if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); s.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr); }
    const trou = new THREE.Path(); trou.absarc(0, 0, r * 0.3, 0, Math.PI * 2, true); s.holes.push(trou);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false }); geo.center(); return M(geo, c, { trait: 0.03 });
  }
  const e1 = engrenage(0.55, 12, '#2864DC'); e1.position.set(-0.45, 1.75, 0); g.add(e1);
  const e2 = engrenage(0.36, 8, '#F2C14E'); e2.position.set(0.42, 1.62, 0); g.add(e2);
  anim.push((t) => { e1.rotation.z = t * 0.9; e2.rotation.z = -t * 0.9 * 12 / 8 + 0.2; });
  const p = panneau('ÉTABLI', 'Pièces techniques', { l: 2.4, h: 1.1 }); p.position.set(0, 0, -1.2); p.scale.setScalar(0.8); g.add(p);
  station('technique', -10, 0, 0, g);
}

// Bureau des devis : boîte aux lettres et panneau bleu
{
  const g = new THREE.Group();
  const pied = M(new THREE.BoxGeometry(0.16, 1.1, 0.16), '#20252B'); pied.position.y = 0.55; g.add(pied);
  const boite = M(new THREE.BoxGeometry(0.9, 0.6, 0.6), '#2864DC'); boite.position.y = 1.4; g.add(boite);
  const fente = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.06), new THREE.MeshBasicMaterial({ color: '#20252B' })); fente.position.set(0, 1.5, 0.305); g.add(fente);
  const drapeau = M(new THREE.BoxGeometry(0.06, 0.4, 0.22), '#E8743B'); drapeau.position.set(0.5, 1.6, 0); g.add(drapeau);
  anim.push((t) => { drapeau.rotation.z = Math.sin(t * 3) * 0.25; });
  const p = panneau('DEVIS', 'Décrivez votre projet', { l: 2.4, h: 1.1, fond: '#2864DC' }); p.position.set(1.7, 0, -0.2); p.rotation.y = -0.3; g.add(p);
  station('devis', 8, 120, -60, g);
}

// Boutique (si le lien existe) : petit kiosque
if (STATIONS.some((s) => s.id === 'boutique')) {
  const g = new THREE.Group();
  const comptoir = M(new THREE.BoxGeometry(2, 1, 1), '#5BB27A'); comptoir.position.y = 0.5; g.add(comptoir);
  for (const x of [-0.9, 0.9]) { const m = M(new THREE.BoxGeometry(0.1, 1.6, 0.1), '#20252B'); m.position.set(x, 1.8, 0.4); g.add(m); }
  const toit = M(new THREE.BoxGeometry(2.3, 0.14, 1.4), '#F2C14E'); toit.position.set(0, 2.65, 0.1); g.add(toit);
  const p = panneau('BOUTIQUE', 'Fichiers STL', { l: 2.4, h: 1.1 }); p.position.set(0, 1.6, -0.6); p.scale.setScalar(0.7); g.add(p);
  station('boutique', 8, 220, 60, g);
}

// ---- La Buse : petit robot tête d'impression (personnage original)
const buse = new THREE.Group(); scene.add(buse);
const corps = new THREE.Group(); buse.add(corps);
const visuel = new THREE.Group(); visuel.rotation.y = Math.PI; corps.add(visuel);   // le visage regarde vers l'avant (-z)
{
  const bloc = M(new THREE.BoxGeometry(0.9, 0.72, 0.8), '#2864DC'); bloc.position.y = 0.86; visuel.add(bloc);
  const ventilo = M(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16), '#20252B', { trait: 0 }); ventilo.rotation.x = Math.PI / 2; ventilo.position.set(0, 0.9, -0.41); visuel.add(ventilo);
  for (const x of [-0.18, 0.18]) {
    const oeil = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' })); oeil.position.set(x, 0.95, 0.405); visuel.add(oeil);
    const pupille = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: '#20252B' })); pupille.position.set(x, 0.94, 0.41); visuel.add(pupille);
  }
  const chauffe = M(new THREE.BoxGeometry(0.34, 0.2, 0.34), '#C9CED3'); chauffe.position.y = 0.42; visuel.add(chauffe);
  const bec = M(new THREE.ConeGeometry(0.13, 0.26, 12), '#D9A441'); bec.rotation.x = Math.PI; bec.position.y = 0.2; visuel.add(bec);
  const antenne = M(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), '#20252B', { trait: 0 }); antenne.position.set(0.22, 1.38, 0); visuel.add(antenne);
  const lampe = M(new THREE.SphereGeometry(0.08, 12, 8), '#E8743B', { trait: 0.02 }); lampe.position.set(0.22, 1.58, 0); visuel.add(lampe);
}
buse.position.set(0, R, 0);
const ombre = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: '#20252B', transparent: true, opacity: 0.18, depthWrite: false }));
ombre.rotation.x = -Math.PI / 2; ombre.position.set(0, R + 0.02, 0); scene.add(ombre);

// ---- Commandes
const touches = new Set();
const CARTE_TOUCHES = { KeyW: 'av', KeyZ: 'av', ArrowUp: 'av', KeyS: 'ar', ArrowDown: 'ar', KeyA: 'g', KeyQ: 'g', ArrowLeft: 'g', KeyD: 'd', ArrowRight: 'd' };
addEventListener('keydown', (e) => {
  const k = CARTE_TOUCHES[e.code]; if (k) { touches.add(k); e.preventDefault(); masquerAide(); }
  if ((e.code === 'Enter' || e.code === 'KeyE') && proche) location.href = proche.lien;
});
addEventListener('keyup', (e) => { const k = CARTE_TOUCHES[e.code]; if (k) touches.delete(k); });
addEventListener('blur', () => touches.clear());
const joy = { x: 0, y: 0, actif: false };
{
  const m = document.getElementById('manette'), b = m.querySelector('span');
  const bouger = (e) => { const r = m.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joy.x = x; joy.y = y; b.style.transform = `translate(${x * 36}px, ${y * 36}px)`; };
  m.addEventListener('pointerdown', (e) => { joy.actif = true; m.setPointerCapture(e.pointerId); bouger(e); masquerAide(); });
  m.addEventListener('pointermove', (e) => joy.actif && bouger(e));
  const fin = () => { joy.actif = false; joy.x = joy.y = 0; b.style.transform = ''; };
  m.addEventListener('pointerup', fin); m.addEventListener('pointercancel', fin);
}
let aideMasquee = false;
function masquerAide() { if (aideMasquee) return; aideMasquee = true; setTimeout(() => document.getElementById('aide').classList.add('cache'), 2500); }

// ---- Carte de station
const carte = document.getElementById('carte'), cT = document.getElementById('carte-titre'), cX = document.getElementById('carte-texte'), cL = document.getElementById('carte-lien');
let proche = null;
function montrer(s) {
  if (s === proche) return; proche = s;
  if (!s) { carte.classList.remove('ouverte'); return; }
  cT.textContent = s.titre; cX.textContent = s.texte; cL.textContent = s.bouton + ' ▸'; cL.href = s.lien;
  if (/^https?:/.test(s.lien)) { cL.target = '_blank'; cL.rel = 'noopener'; } else { cL.removeAttribute('target'); cL.removeAttribute('rel'); }
  carte.classList.add('ouverte');
}

// ---- Boucle
let cap = 0, vitesse = 0, horloge = new THREE.Clock(), pas = 0;
const tmp = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
// Départ : face au panneau d'accueil
planete.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(18));
function taille() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 56 : 42; cam.updateProjectionMatrix(); }
addEventListener('resize', taille); taille();

function boucle() {
  const dt = Math.min(horloge.getDelta(), 0.05), t = horloge.elapsedTime;
  let av = (touches.has('av') ? 1 : 0) - (touches.has('ar') ? 1 : 0), tr = (touches.has('d') ? 1 : 0) - (touches.has('g') ? 1 : 0);
  if (joy.actif) { av = -joy.y; tr = joy.x; }
  cap -= tr * dt * 2.4;
  const cible = av * 5.2; vitesse += (cible - vitesse) * Math.min(1, dt * 8);
  if (Math.abs(vitesse) > 0.01) {
    const avant = new THREE.Vector3(-Math.sin(cap), 0, -Math.cos(cap));
    const axe = new THREE.Vector3().crossVectors(haut, avant).normalize();
    q.setFromAxisAngle(axe, -(vitesse * dt) / R); planete.quaternion.premultiply(q);
    pas += Math.abs(vitesse) * dt * 2.2;
  }
  buse.rotation.y = cap;
  corps.position.y = Math.abs(Math.sin(pas * 2)) * 0.12 * Math.min(1, Math.abs(vitesse) / 2);
  corps.rotation.z = Math.sin(pas * 2) * 0.06 * Math.min(1, Math.abs(vitesse) / 2);
  corps.rotation.x = vitesse * 0.025;
  if (!reduit) for (const f of anim) f(t);

  // Caméra derrière et au-dessus du personnage
  const d = innerWidth < innerHeight ? 11 : 9.5, hc = innerWidth < innerHeight ? 7.5 : 6;
  cam.position.set(Math.sin(cap) * d, R + hc, Math.cos(cap) * d);
  cam.lookAt(-Math.sin(cap) * 3.5, R + 0.2, -Math.cos(cap) * 3.5);

  // Station la plus proche
  let meilleure = null, dm = 3.1;
  for (const s of points) { s.g.getWorldPosition(tmp); const dd = tmp.distanceTo(buse.position); if (dd < dm) { dm = dd; meilleure = s; } }
  montrer(meilleure);

  renderer.render(scene, cam);
  requestAnimationFrame(boucle);
}
document.fonts.ready.then(() => { document.getElementById('chargement').classList.add('fini'); });
setTimeout(() => document.getElementById('chargement').classList.add('fini'), 2500);
cv.focus({ preventScroll: true });
requestAnimationFrame(boucle);
