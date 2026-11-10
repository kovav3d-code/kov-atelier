/**
 * Suggestion de prix indicative pour l'atelier (affichée dans Telegram uniquement).
 * Combine : forfait de conception selon les prestations cochées, impression au cm³
 * (volume mesuré dans le STL du client, sinon estimé depuis les dimensions), quantité et urgence.
 */
import { TARIFS } from '../../src/config/tarifs';

export type MesureStl = { nom: string; volumeCm3: number; boite: [number, number, number]; triangles: number; ferme: boolean };

/** Volume (cm³, unités du fichier supposées en mm) et boîte englobante d'un STL binaire ou ASCII. */
export function mesurerStl(nom: string, buf: ArrayBuffer): MesureStl | null {
  const dv = new DataView(buf);
  const pts: number[] = [];
  if (buf.byteLength >= 84) {
    const n = dv.getUint32(80, true);
    if (84 + n * 50 === buf.byteLength) {
      for (let i = 0; i < n; i++) { const o = 84 + i * 50 + 12; for (let k = 0; k < 9; k++) pts.push(dv.getFloat32(o + k * 4, true)); }
    }
  }
  if (!pts.length) {
    const txt = new TextDecoder().decode(buf.slice(0, Math.min(buf.byteLength, 60 * 1024 * 1024)));
    for (const m of txt.matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/g)) pts.push(+m[1], +m[2], +m[3]);
    if (pts.length % 9) pts.length -= pts.length % 9;
  }
  if (!pts.length) return null;
  let vol = 0; const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const aretes = new Map<string, number>();
  const cle = (i: number) => `${pts[i].toFixed(4)},${pts[i + 1].toFixed(4)},${pts[i + 2].toFixed(4)}`;
  for (let t = 0; t < pts.length; t += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = pts.slice(t, t + 9);
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    for (let k = 0; k < 9; k++) { const a = k % 3; min[a] = Math.min(min[a], pts[t + k]); max[a] = Math.max(max[a], pts[t + k]); }
    if (pts.length / 9 <= 300000) {
      const s = [cle(t), cle(t + 3), cle(t + 6)];
      for (const [p, q] of [[0, 1], [1, 2], [2, 0]]) { const e = [s[p], s[q]].sort().join('|'); aretes.set(e, (aretes.get(e) ?? 0) + 1); }
    }
  }
  const ferme = aretes.size ? [...aretes.values()].every((c) => c === 2) : true;
  return { nom, volumeCm3: Math.abs(vol) / 1000, boite: [max[0] - min[0], max[1] - min[1], max[2] - min[2]], triangles: pts.length / 9, ferme };
}

/** Lit « 40x26x28 », « 4 x 2,6 x 2,8 cm », « 120 mm »… → dimensions en mm (null si illisible). */
export function lireDimensions(s: string | null): { mm: number[]; unite: string } | null {
  if (!s) return null;
  const nombres = [...s.replace(/,/g, '.').matchAll(/\d+(?:\.\d+)?/g)].map((m) => +m[0]).slice(0, 3);
  if (!nombres.length) return null;
  const unite = /\bm\b|mètre/i.test(s) && !/mm|cm/i.test(s) ? 'm' : /cm/i.test(s) ? 'cm' : 'mm';
  const f = unite === 'm' ? 1000 : unite === 'cm' ? 10 : 1;
  return { mm: nombres.map((n) => n * f), unite };
}

const arrondi = (n: number) => (n < 100 ? Math.round(n / 5) * 5 : Math.round(n / 10) * 10);

export function suggererPrix(p: {
  prestations: string[]; materiau: string | null; dimensions: string | null; quantite: string | null; delai: string | null; stl: MesureStl[];
}) {
  const notes: string[] = [];
  let bas = 0, haut = 0;
  const veutImpression = p.prestations.includes('impression') || p.prestations.includes('prototype');
  const conceptions = p.prestations.filter((x) => x !== 'impression');
  // Conception : la prestation la plus lourde compte en entier, les autres pour moitié.
  const f = conceptions.map((x) => TARIFS.conception[x]).filter(Boolean).sort((a, b) => b[1] - a[1]);
  f.forEach(([b, h], i) => { const k = i === 0 ? 1 : 0.5; bas += b * k; haut += h * k; });
  if (f.length) notes.push(`conception ${arrondi(f.reduce((s, [b], i) => s + b * (i ? 0.5 : 1), 0))}–${arrondi(f.reduce((s, [, h], i) => s + h * (i ? 0.5 : 1), 0))} €`);

  if (veutImpression) {
    const resine = /r[ée]sin/i.test(p.materiau ?? '') || p.prestations.includes('artistique');
    const t = resine ? TARIFS.impression.resine : TARIFS.impression.filament;
    let volume: number | null = null;
    if (p.stl.length) {
      volume = p.stl.reduce((s, m) => s + m.volumeCm3, 0);
      notes.push(`volume mesuré dans le STL : ${volume.toFixed(1)} cm³`);
      const ouverts = p.stl.filter((m) => !m.ferme).map((m) => m.nom);
      if (ouverts.length) notes.push(`maillage non fermé (${ouverts.join(', ')}) : volume peu fiable, réparation à prévoir`);
    } else {
      const dims = lireDimensions(p.dimensions);
      if (dims && dims.mm.length === 3) {
        volume = (dims.mm[0] * dims.mm[1] * dims.mm[2] / 1000) * TARIFS.remplissageEstime;
        notes.push(`volume estimé depuis les dimensions (lues en ${dims.unite}, remplissage ${Math.round(TARIFS.remplissageEstime * 100)} %) : ~${volume.toFixed(0)} cm³`);
      } else notes.push('impression non chiffrée : ni STL ni dimensions complètes');
    }
    if (volume !== null) {
      const qte = Math.max(1, Math.min(1000, parseInt(p.quantite ?? '1', 10) || 1));
      const ib = (t.preparation + volume * t.parCm3[0]) * qte, ih = (t.preparation + volume * t.parCm3[1]) * qte;
      bas += ib; haut += ih;
      notes.push(`impression ${resine ? 'résine' : 'filament'}${qte > 1 ? ` ×${qte}` : ''} ${arrondi(ib)}–${arrondi(ih)} €`);
    }
  }
  const maj = p.delai ? TARIFS.delai[p.delai] : undefined;
  if (maj?.fois) { bas *= maj.fois; haut *= maj.fois; notes.push(`délai court : +${Math.round((maj.fois - 1) * 100)} %`); }
  if (maj?.plus) { bas += maj.plus; haut += maj.plus; notes.push(`mode urgent : +${maj.plus} €`); }
  bas = Math.max(TARIFS.minimumCommande, arrondi(bas)); haut = Math.max(bas, arrondi(haut));
  return { bas, haut, notes };
}
