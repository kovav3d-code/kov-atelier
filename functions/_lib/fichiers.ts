import { FICHIERS } from '../../src/config/devis';

const commencePar = (b: Uint8Array, sig: number[]) => sig.every((x, i) => b[i] === x);
const texte = (b: Uint8Array, n = 64) => String.fromCharCode(...b.slice(0, n)).replace(/^\uFEFF|^\xEF\xBB\xBF/, '').trimStart().toLowerCase();
const contientNul = (b: Uint8Array) => b.includes(0);

/**
 * Vérifie que le contenu réel correspond à l'extension annoncée (signature binaire),
 * et refuse tout exécutable déguisé. Ne remplace pas un antivirus.
 */
export async function contenuValide(f: File, ext: string): Promise<boolean> {
  const b = new Uint8Array(await f.slice(0, 4096).arrayBuffer());
  if (commencePar(b, [0x4d, 0x5a]) || commencePar(b, [0x7f, 0x45, 0x4c, 0x46]) || commencePar(b, [0x23, 0x21]) || commencePar(b, [0xcf, 0xfa, 0xed, 0xfe])) return false;
  switch (ext) {
    case 'pdf': return commencePar(b, [0x25, 0x50, 0x44, 0x46]);
    case 'png': return commencePar(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'jpg': case 'jpeg': return commencePar(b, [0xff, 0xd8, 0xff]);
    case 'zip': case '3mf': return commencePar(b, [0x50, 0x4b, 0x03, 0x04]) || commencePar(b, [0x50, 0x4b, 0x05, 0x06]);
    case 'step': case 'stp': return texte(b).startsWith('iso-10303-21');
    case 'obj': return !contientNul(b);
    case 'stl': {
      if (f.size >= 84 && b.length >= 84) {
        const triangles = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(80, true);
        if (84 + triangles * 50 === f.size) return true; // STL binaire : taille exacte attendue
      }
      return texte(b).startsWith('solid') && !contientNul(b); // STL ASCII
    }
    default: return false;
  }
}

export const extension = (nom: string) => (nom.includes('.') ? nom.split('.').pop()!.toLowerCase() : '');
export const extensionAutorisee = (ext: string) => FICHIERS.extensions.includes(ext);
export const nomPropre = (nom: string) => nom.normalize('NFKD').replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, '_').slice(-100) || 'fichier';
