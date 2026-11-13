// Visionneuses 3D de la page Réalisations : chaque modèle tourne en boucle (360°),
// on peut le faire pivoter à la souris ou au doigt. Three.js n'est chargé que lorsqu'un
// modèle approche de l'écran ; le rendu s'arrête quand il en sort.
const cadres = [...document.querySelectorAll('[data-modele-3d]')];
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

let THREE_P = null;
const charger = () => (THREE_P ??= Promise.all([
  import('/vendor/three/three.module.min.js'),
  import('/vendor/three/loaders/GLTFLoader.js'),
  import('/vendor/three/loaders/STLLoader.js'),
]));

function webglDispo() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

async function monter(cadre) {
  const [THREE, { GLTFLoader }, { STLLoader }] = await charger();
  const url = cadre.dataset.fichier;
  const couleur = cadre.dataset.couleur || '#C9CED4';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  cadre.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
  scene.add(new THREE.HemisphereLight(0xf7f8f6, 0x20252b, 1.1));
  const cle = new THREE.DirectionalLight(0xffffff, 2.2); cle.position.set(2, 3, 2.5); scene.add(cle);
  const contre = new THREE.DirectionalLight(0x8fb0f5, 2.4); contre.position.set(-2.5, 1.5, -2.5); scene.add(contre);

  const pivot = new THREE.Group(); scene.add(pivot);
  let objet;
  if (/\.stl(\?|$)/i.test(url)) {
    const geo = await new STLLoader().loadAsync(url);
    geo.computeVertexNormals();
    objet = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.45, metalness: 0.1 }));
    objet.rotation.x = -Math.PI / 2; // STL : axe Z vers le haut
  } else {
    objet = (await new GLTFLoader().loadAsync(url)).scene;
  }
  // Centre le modèle et le pose sur l'origine, puis cadre la caméra sur sa sphère englobante.
  const enveloppe = new THREE.Group(); enveloppe.add(objet); pivot.add(enveloppe);
  const boite = new THREE.Box3().setFromObject(enveloppe);
  const centre = boite.getCenter(new THREE.Vector3());
  enveloppe.position.sub(centre);
  const rayon = boite.getBoundingSphere(new THREE.Sphere()).radius;
  const dist = rayon / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9;
  camera.position.set(0, rayon * 0.35, dist);
  camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);

  const ajuster = () => {
    const w = cadre.clientWidth, h = cadre.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(ajuster).observe(cadre); ajuster();

  // Glisser pour faire pivoter ; la rotation automatique reprend ensuite.
  let glisse = false, x0 = 0, vitesse = 0, reprise = 0;
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { glisse = true; x0 = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (!glisse) return; const dx = e.clientX - x0; x0 = e.clientX; pivot.rotation.y += dx * 0.01; vitesse = dx * 0.01; });
  const lacher = () => { glisse = false; reprise = performance.now() + 1200; };
  el.addEventListener('pointerup', lacher); el.addEventListener('pointercancel', lacher);

  let visible = true, dernier = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { dernier = performance.now(); requestAnimationFrame(boucle); } }).observe(cadre);
  function boucle(t) {
    if (!visible) return;
    const dt = Math.min((t - dernier) / 1000, 0.05); dernier = t;
    if (!glisse) {
      vitesse *= 0.92;
      pivot.rotation.y += vitesse + (reduit || t < reprise ? 0 : dt * 0.45);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(boucle);
  }
  cadre.classList.add('pret');
  requestAnimationFrame(boucle);
}

if (cadres.length && webglDispo()) {
  const obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      obs.unobserve(e.target);
      monter(e.target).catch((err) => { console.warn('Modèle 3D indisponible', err); e.target.classList.add('erreur'); });
    }
  }, { rootMargin: '200px' });
  cadres.forEach((c) => obs.observe(c));
}

// Vidéos de rotation 360° : lecture seulement quand elles sont visibles.
document.querySelectorAll('video[data-boucle]').forEach((v) => {
  if (reduit) return;
  new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.3 }).observe(v);
});
