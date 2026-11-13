// Hero : imprimante 3D en vraie 3D (Three.js). La buse imprime un buste couche par couche,
// la pièce finie tourne, puis l'impression recommence. On peut faire pivoter la scène au doigt.
// Si WebGL manque, ou si l'utilisateur limite les animations, l'animation dessinée (SVG) reste en place.
const figure = document.querySelector('[data-imprimante-3d]');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglDispo() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

// Profil du buste : demi-largeur (rx), demi-profondeur (rz) et avancée (dz) selon la hauteur h ∈ [0, 1].
function profil(h) {
  const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  if (h < 0.07) return { rx: 0.40, rz: 0.30, dz: 0 };                       // socle
  if (h < 0.11) return { rx: 0.27, rz: 0.21, dz: 0 };                       // piédouche
  if (h < 0.46) {                                                           // buste et épaules
    const e = Math.sin(Math.PI * lisse(0.11, 0.46, h) * 0.85);
    return { rx: 0.30 + 0.24 * e, rz: 0.20 + 0.06 * e, dz: 0 };
  }
  if (h < 0.56) return { rx: 0.15, rz: 0.15, dz: 0.02 };                    // cou
  const t = (h - 0.555) / 0.445;                                            // tête
  const s = Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02))), 0.55);
  return { rx: 0.21 * s, rz: 0.26 * s, dz: 0.05 * s };
}

async function lancer() {
  const THREE = await import('/vendor/three/three.module.min.js');
  const conteneur = document.createElement('div');
  conteneur.className = 'imp3d';
  figure.appendChild(conteneur);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  conteneur.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xf7f8f6, 0x14181d, 1.0));
  const cle = new THREE.DirectionalLight(0xffffff, 2.0); cle.position.set(2.5, 4, 3); scene.add(cle);
  const contre = new THREE.DirectionalLight(0x8fb0f5, 2.6); contre.position.set(-3, 2, -2.5); scene.add(contre);

  const monde = new THREE.Group(); scene.add(monde);
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a434c, roughness: 0.5, metalness: 0.55 });
  const metalClair = new THREE.MeshStandardMaterial({ color: 0x5b6570, roughness: 0.4, metalness: 0.65 });
  const bleu = new THREE.MeshStandardMaterial({ color: 0x8fb0f5, emissive: 0x8fb0f5, emissiveIntensity: 1.6 });
  const boite = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); monde.add(o); return o; };

  // Châssis : socle, montants, traverse supérieure.
  boite(2.3, 0.22, 1.7, metal, 0, -0.11, 0);
  for (const x of [-1.05, 1.05]) boite(0.09, 2.45, 0.09, metalClair, x, 1.1, -0.55);
  boite(2.2, 0.08, 0.1, metalClair, 0, 2.32, -0.55);
  const led = boite(0.05, 0.03, 0.01, bleu, -0.95, -0.05, 0.851);

  // Plateau (avance et recule sous la buse, comme sur une imprimante cartésienne).
  const plateau = new THREE.Group(); monde.add(plateau);
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 1.3), new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.35, metalness: 0.8 }));
  plaque.position.y = 0.02; plateau.add(plaque);

  // Pièce : le buste en couches.
  const N = 46, H = 1.35, eh = H / N;
  const blanc = new THREE.MeshStandardMaterial({ color: 0xeef0ee, roughness: 0.62, metalness: 0.0 });
  const chaud = new THREE.MeshStandardMaterial({ color: 0xbfd2ff, emissive: 0x8fb0f5, emissiveIntensity: 0.9, roughness: 0.4 });
  const piece = new THREE.Group(); piece.position.y = 0.04; plateau.add(piece);
  const geoCouche = new THREE.CylinderGeometry(1, 1, eh * 0.78, 40);
  const couches = [];
  for (let i = 0; i < N; i++) {
    const p = profil((i + 0.5) / N);
    const m = new THREE.Mesh(geoCouche, blanc);
    m.scale.set(Math.max(p.rx, 0.01), 1, Math.max(p.rz, 0.01));
    m.position.set(0, eh * (i + 0.5), p.dz);
    m.visible = false;
    piece.add(m); couches.push({ m, p });
  }

  // Axe X (monte avec les couches) et tête d'impression (glisse sur l'axe).
  const axe = new THREE.Group(); monde.add(axe);
  const barre = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, 0.07), metalClair); barre.position.z = -0.45; axe.add(barre);
  const tete = new THREE.Group(); axe.add(tete);
  const corps = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.3), metal); corps.position.set(0, 0.2, -0.3); tete.add(corps);
  const bras = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.32), metal); bras.position.set(0, 0.12, -0.1); tete.add(bras);
  const buse = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9 }));
  buse.rotation.x = Math.PI; buse.position.y = 0.06; tete.add(buse);
  const lueur = new THREE.PointLight(0x8fb0f5, 0.0, 0.8); lueur.position.y = 0.02; tete.add(lueur);
  const voyant = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), bleu); voyant.position.set(0.1, 0.3, -0.14); tete.add(voyant);

  // Cadrage.
  const ajuster = () => {
    const w = conteneur.clientWidth, h = conteneur.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(ajuster).observe(conteneur); ajuster();

  // Rotation au doigt / à la souris.
  let angle = 0, glisse = false, x0 = 0, elan = 0;
  const el = renderer.domElement; el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { glisse = true; x0 = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (!glisse) return; const dx = (e.clientX - x0) * 0.008; x0 = e.clientX; angle += dx; elan = dx; });
  const lacher = () => { glisse = false; };
  el.addEventListener('pointerup', lacher); el.addEventListener('pointercancel', lacher);

  // Chronologie d'une boucle : impression → présentation → remise à zéro.
  const T_COUCHE = 0.19, T_IMPR = N * T_COUCHE, T_PRES = 3.2, T_RAZ = 0.8, T_BOUCLE = T_IMPR + T_PRES + T_RAZ;
  let debut = performance.now(), visible = true, pause = 0;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) { debut += performance.now() - pause; visible = true; requestAnimationFrame(image); }
    else if (!e.isIntersecting && visible) { visible = false; pause = performance.now(); }
  }).observe(conteneur);

  function image(now) {
    if (!visible) return;
    const t = (Math.max(0, now - debut) / 1000) % T_BOUCLE;
    let tx = 0, tz = 0, hauteur = 0, rotPiece = 0;

    if (t < T_IMPR) {
      const k = Math.min(N - 1, Math.floor(t / T_COUCHE)), u = Math.min(1, (t - k * T_COUCHE) / T_COUCHE);
      couches.forEach((c, i) => { c.m.visible = i <= k; c.m.material = i === k ? chaud : blanc; c.m.scale.y = i === k ? Math.max(0.05, u) : 1; });
      const { p } = couches[k];
      const a = u * Math.PI * 2;
      tx = Math.cos(a) * p.rx; tz = Math.sin(a) * p.rz + p.dz;
      hauteur = 0.04 + eh * (k + 1);
      lueur.intensity = 0.9;
    } else if (t < T_IMPR + T_PRES) {
      couches.forEach((c) => { c.m.visible = true; c.m.material = blanc; c.m.scale.y = 1; });
      const u = (t - T_IMPR) / T_PRES;
      const e = u * u * (3 - 2 * u);
      hauteur = 0.04 + H + 0.35 * Math.min(1, u * 3); tx = 0.85 * Math.min(1, u * 3); tz = 0;
      rotPiece = e * Math.PI * 2;
      lueur.intensity = 0;
    } else {
      const u = (t - T_IMPR - T_PRES) / T_RAZ;
      couches.forEach((c, i) => { c.m.visible = i / N < 1 - u; });
      hauteur = 0.04 + (H + 0.35) * (1 - u); tx = 0.85 * (1 - u);
      lueur.intensity = 0;
    }

    // La buse se déplace en X, le plateau en Z (dessous), l'axe monte avec les couches.
    tete.position.x = tx;
    plateau.position.z = -tz;
    axe.position.y = hauteur + 0.06;
    piece.rotation.y = rotPiece;
    led.material.emissiveIntensity = 1 + Math.sin(now / 300) * 0.6;

    if (!glisse) { elan *= 0.93; angle += elan; }
    const balayage = reduit ? 0 : Math.sin(now / 4200) * 0.28;
    monde.rotation.y = angle + balayage - 0.35;
    camera.position.set(0, 1.85, 5.6);
    camera.lookAt(0, 0.95, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(image);
  }
  figure.classList.add('imp3d-actif');
  requestAnimationFrame(image);
}

if (figure && !reduit && webglDispo()) {
  // Ne charge Three.js qu'une fois la page affichée, pour ne pas ralentir l'arrivée sur le site.
  const go = () => lancer().catch((e) => console.warn('Imprimante 3D indisponible', e));
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 800);
}
