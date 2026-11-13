// Imprimante 3D (Three.js) : la buse imprime le mot « SOLUTION » couche par couche,
// le mot terminé est présenté, puis l'impression recommence. La scène pivote au doigt.
// Si WebGL manque, ou si l'utilisateur limite les animations, l'animation dessinée (SVG) reste en place.
const figure = document.querySelector('[data-imprimante-3d]');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOT = 'SOLUTION';

function webglDispo() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

// Découpe le mot en tranches horizontales : pour chaque couche, les segments pleins (x0, x1) entre 0 et 1.
async function tranches(nCouches) {
  try { await document.fonts.ready; } catch {}
  const c = document.createElement('canvas'); c.width = 1400; c.height = 300;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = `800 210px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`;
  g.fillText(MOT, c.width / 2, c.height / 2);
  const { data } = g.getImageData(0, 0, c.width, c.height);
  const plein = (x, y) => data[(y * c.width + x) * 4] > 127;
  let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (plein(x, y)) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const couches = [];
  for (let i = 0; i < nCouches; i++) {
    const y = Math.min(y1, Math.round(y1 - (i + 0.5) * h / nCouches)); // de bas en haut
    const segs = []; let debut = -1;
    for (let x = x0; x <= x1 + 1; x++) {
      const p = x <= x1 && plein(x, y);
      if (p && debut < 0) debut = x;
      if (!p && debut >= 0) { segs.push([(debut - x0) / w, (x - x0) / w]); debut = -1; }
    }
    couches.push(segs);
  }
  return { couches, ratio: h / w };
}

async function lancer() {
  const THREE = await import('/vendor/three/three.module.min.js');
  const N = 34;
  const { couches: tr, ratio } = await tranches(N);

  const conteneur = document.createElement('div');
  conteneur.className = 'imp3d';
  figure.appendChild(conteneur);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  conteneur.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xf7f8f6, 0x14181d, 1.0));
  const cle = new THREE.DirectionalLight(0xffffff, 2.0); cle.position.set(2.5, 4, 4); scene.add(cle);
  const contre = new THREE.DirectionalLight(0x8fb0f5, 2.6); contre.position.set(-3, 2.5, -3); scene.add(contre);

  // Dimensions du mot (unités de scène).
  const L = 3.4, HM = L * ratio, P = 0.36, eh = HM / N;
  const LARG = L + 1.1, HAUT = HM + 0.95;

  const monde = new THREE.Group(); scene.add(monde);
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a434c, roughness: 0.5, metalness: 0.55 });
  const metalClair = new THREE.MeshStandardMaterial({ color: 0x5b6570, roughness: 0.4, metalness: 0.65 });
  const bleu = new THREE.MeshStandardMaterial({ color: 0x8fb0f5, emissive: 0x8fb0f5, emissiveIntensity: 1.6 });
  const boite = (w, h, d, m, x, y, z, parent = monde) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };

  // Châssis.
  boite(LARG + 0.2, 0.22, 1.5, metal, 0, -0.11, 0);
  for (const x of [-LARG / 2, LARG / 2]) boite(0.09, HAUT, 0.09, metalClair, x, HAUT / 2 - 0.05, -0.5);
  boite(LARG + 0.1, 0.08, 0.1, metalClair, 0, HAUT, -0.5);
  const led = boite(0.06, 0.03, 0.01, bleu, -LARG / 2 + 0.15, -0.05, 0.751);

  // Plateau.
  const plateau = new THREE.Group(); monde.add(plateau);
  boite(LARG - 0.3, 0.04, 1.1, new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.35, metalness: 0.8 }), 0, 0.02, 0, plateau);

  // Le mot, en couches : un segment = une petite poutre.
  const blanc = new THREE.MeshStandardMaterial({ color: 0xeef0ee, roughness: 0.62 });
  const chaud = new THREE.MeshStandardMaterial({ color: 0xbfd2ff, emissive: 0x8fb0f5, emissiveIntensity: 0.9, roughness: 0.4 });
  const piece = new THREE.Group(); piece.position.y = 0.04; plateau.add(piece);
  const geo = new THREE.BoxGeometry(1, eh * 0.8, P);
  const couches = tr.map((segs, i) => segs.map(([a, b]) => {
    const m = new THREE.Mesh(geo, blanc);
    const x0 = -L / 2 + a * L, x1 = -L / 2 + b * L;
    m.scale.x = Math.max(0.005, x1 - x0); m.position.set((x0 + x1) / 2, eh * (i + 0.5), 0);
    m.visible = false; m.userData = { x0, x1 }; piece.add(m); return m;
  }));

  // Axe X et tête.
  const axe = new THREE.Group(); monde.add(axe);
  boite(LARG + 0.1, 0.07, 0.07, metalClair, 0, 0, -0.42, axe);
  const tete = new THREE.Group(); axe.add(tete);
  boite(0.26, 0.3, 0.3, metal, 0, 0.2, -0.3, tete);
  boite(0.08, 0.08, 0.28, metal, 0, 0.12, -0.08, tete);
  const buse = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 0.9 }));
  buse.rotation.x = Math.PI; buse.position.y = 0.06; tete.add(buse);
  const lueur = new THREE.PointLight(0x8fb0f5, 0, 0.9); lueur.position.y = 0.02; tete.add(lueur);
  boite(0.035, 0.035, 0.035, bleu, 0.1, 0.3, -0.14, tete);

  const ajuster = () => {
    const w = conteneur.clientWidth, h = conteneur.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(ajuster).observe(conteneur); ajuster();

  let angle = 0, glisse = false, x0 = 0, elan = 0;
  const el = renderer.domElement; el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { glisse = true; x0 = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (!glisse) return; const dx = (e.clientX - x0) * 0.008; x0 = e.clientX; angle += dx; elan = dx; });
  const lacher = () => { glisse = false; };
  el.addEventListener('pointerup', lacher); el.addEventListener('pointercancel', lacher);

  const T_COUCHE = 0.24, T_IMPR = N * T_COUCHE, T_PRES = 2.8, T_RAZ = 0.8, T_BOUCLE = T_IMPR + T_PRES + T_RAZ;
  let debut = performance.now(), visible = true, pause = 0;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) { debut += performance.now() - pause; visible = true; requestAnimationFrame(image); }
    else if (!e.isIntersecting && visible) { visible = false; pause = performance.now(); }
  }).observe(conteneur);

  function image(now) {
    if (!visible) return;
    const t = (Math.max(0, now - debut) / 1000) % T_BOUCLE;
    let tx = 0, hauteur = 0, tz = 0;
    if (t < T_IMPR) {
      const k = Math.min(N - 1, Math.floor(t / T_COUCHE)), u = Math.min(1, (t - k * T_COUCHE) / T_COUCHE);
      const sens = k % 2 ? -1 : 1;                              // trajet en zigzag, une couche sur deux
      tx = sens * (-L / 2 + u * L);
      couches.forEach((segs, i) => segs.forEach((m) => {
        if (i < k) { m.visible = true; m.material = blanc; }
        else if (i > k) m.visible = false;
        else {
          const { x0: a, x1: b } = m.userData;
          const deja = sens > 0 ? tx >= a : tx <= b;
          m.visible = deja; m.material = chaud;
        }
      }));
      hauteur = 0.04 + eh * (k + 1);
      tz = Math.sin(now / 90) * 0.04;
      lueur.intensity = 0.9;
    } else if (t < T_IMPR + T_PRES) {
      couches.forEach((segs) => segs.forEach((m) => { m.visible = true; m.material = blanc; }));
      const u = Math.min(1, (t - T_IMPR) / 0.6);
      hauteur = 0.04 + HM + 0.35 * u; tx = (L / 2 + 0.3) * u;
      lueur.intensity = 0;
    } else {
      const u = (t - T_IMPR - T_PRES) / T_RAZ;
      couches.forEach((segs, i) => segs.forEach((m) => { m.visible = i / N < 1 - u; }));
      hauteur = 0.04 + (HM + 0.35) * (1 - u); tx = (L / 2 + 0.3) * (1 - u);
      lueur.intensity = 0;
    }
    tete.position.x = tx;
    plateau.position.z = tz;
    axe.position.y = hauteur + 0.06;
    led.material.emissiveIntensity = 1 + Math.sin(now / 300) * 0.6;

    if (!glisse) { elan *= 0.93; angle += elan; }
    monde.rotation.y = angle + (reduit ? 0 : Math.sin(now / 5200) * 0.22) - 0.18;
    // Recul calculé pour que l'imprimante remplisse la largeur du cadre.
    const demiFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max((LARG / 2 + 0.25) / (Math.tan(demiFov) * camera.aspect), (HAUT / 2 + 0.35) / Math.tan(demiFov)) + 0.75;
    camera.position.set(0, HAUT * 0.62, dist);
    camera.lookAt(0, HAUT * 0.45, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(image);
  }
  figure.classList.add('imp3d-actif');
  requestAnimationFrame(image);
}

if (figure && !reduit && webglDispo()) {
  // Ne charge Three.js que lorsque l'animation approche de l'écran.
  new IntersectionObserver((e, obs) => {
    if (!e[0].isIntersecting) return;
    obs.disconnect();
    lancer().catch((err) => console.warn('Imprimante 3D indisponible', err));
  }, { rootMargin: '400px' }).observe(figure);
}
