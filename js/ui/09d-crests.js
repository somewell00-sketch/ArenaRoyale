/* ---------- Crests: modular SVG coats of arms, drawn from a school's own data ----------
   shape × field division × tinctures × charge (from the school's Nen and name) × marks (stars for masters, a ribbon with the founding year).
   A branch keeps its parent's arms and adds a mark of difference: a label for a first branch, a bordure for a branch of a branch. */
const CR_NEN = {Enhancement: '#6cc07a', Transmutation: '#a98be0', Emission: '#e58c4b', Conjuration: '#6b9fe0', Manipulation: '#e0c64f', Specialization: '#df5d5d'};
const CR_TINCT = ['#1b2226', '#e7e3d8', '#d9a640', '#7a2e2e', '#24476b', '#2f5a3a', '#4a2f5c'];
const CR_SHAPE = {
  heater: 'M10 10 H90 V55 C90 84 72 100 50 112 C28 100 10 84 10 55 Z',
  round: 'M50 14 A46 46 0 1 1 49.9 14 Z',
  lozenge: 'M50 8 L93 61 L50 114 L7 61 Z',
  banner: 'M14 8 H86 V100 L50 84 L14 100 Z',
  tablet: 'M20 10 H80 Q90 10 90 20 V100 Q90 110 80 110 H20 Q10 110 10 100 V20 Q10 10 20 10 Z',
  kite: 'M50 6 C78 10 90 28 88 50 C85 80 67 99 50 114 C33 99 15 80 12 50 C10 28 22 10 50 6 Z',
  hexagon: 'M50 8 L94 33 V87 L50 112 L6 87 V33 Z',
  swallowtail: 'M12 8 H88 V108 L70 92 L50 110 L30 92 L12 108 Z',
  octagon: 'M32 10 H68 L90 32 V88 L68 110 H32 L10 88 V32 Z',
  arch: 'M12 112 V46 C12 24 30 8 50 8 C70 8 88 24 88 46 V112 Z',
  cartouche: 'M22 10 H78 C78 18 90 18 90 26 V94 C90 102 78 102 78 110 H22 C22 102 10 102 10 94 V26 C10 18 22 18 22 10 Z',
  mon: ''
};
// the mon: a round crest with eight scalloped lobes, like a Japanese family badge
CR_SHAPE.mon = (() => { const cx = 50, cy = 61, R = 46, r = 40, n = 8; let d = ''; for(let i = 0; i < n; i++){ const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2, p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], c = [cx + R * 1.12 * Math.cos(am), cy + R * 1.12 * Math.sin(am)]; d += (i ? '' : `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} `) + `Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} `; } return d + 'Z'; })();
const CR_DIV = ['plain', 'pale', 'fess', 'quarterly', 'bend', 'chevron', 'chequy', 'saltire', 'gyronny', 'barry', 'pily', 'wavy', 'chief', 'canton', 'cross', 'pall'];
// charges, drawn around (50, 60) in a 44-unit box: full silhouettes, five for each Nen category
const CR_CHG = {
  // Enhancement
  mountain: '<path d="M22 80 L40 46 L48 58 L60 38 L78 80 Z"/><path d="M60 38 L53 51 L60 47 L66 52 Z" class="cr-hl"/>',
  anvil: '<path d="M22 46 H70 Q80 46 82 40 Q83 54 70 56 H62 V66 H70 V78 H32 V66 H40 V56 H32 Q24 55 22 46 Z"/>',
  fist: '<path d="M33 50 Q33 41 41 41 H59 Q67 41 67 50 V64 Q67 78 54 80 H45 Q33 78 33 66 Z"/><path d="M42 41 V53 M50 41 V53 M58 41 V53 M33 60 H45 Q50 60 50 65" class="cr-thin"/>',
  ox: '<path d="M24 38 Q30 52 42 50 L44 72 Q50 82 56 72 L58 50 Q70 52 76 38 Q66 46 57 43 H43 Q34 46 24 38 Z"/><circle cx="45" cy="58" r="2.2" class="cr-pupil"/><circle cx="55" cy="58" r="2.2" class="cr-pupil"/>',
  oak: '<path d="M50 34 C63 34 72 43 69 53 C74 60 67 69 58 67 H42 C33 69 26 60 31 53 C28 43 37 34 50 34 Z"/><path d="M45 66 H55 V82 H45 Z"/>',
  // Transmutation
  flame: '<path d="M50 34 C62 47 69 55 65 68 C63 77 56 82 50 82 C42 82 35 75 35 66 C35 57 42 52 45 45 C47 54 52 57 55 57 C55 50 53 43 50 34 Z"/><path d="M50 60 C54 65 55 69 52 74 C49 76 45 73 46 69 C47 66 49 64 50 60 Z" class="cr-hl"/>',
  wave: '<path d="M22 70 C30 50 44 46 52 54 C58 60 54 68 47 66 C52 60 44 56 38 62 C34 66 34 72 36 76 H78 V82 H22 Z"/><path d="M50 44 C60 36 74 40 78 52 C70 46 62 46 56 50 Z"/>',
  bolt: '<path d="M56 32 L36 62 H50 L42 88 L66 54 H52 L60 32 Z"/>',
  serpent: '<path d="M62 38 C40 36 38 54 50 58 C62 62 62 78 38 80" class="cr-line cr-fat"/><circle cx="63" cy="38" r="6"/><circle cx="64" cy="37" r="1.6" class="cr-pupil"/>',
  feather: '<path d="M66 34 C46 38 34 56 36 82 C52 72 64 56 66 34 Z"/><path d="M36 82 L62 40 M44 66 L54 64 M48 58 L59 54" class="cr-thin"/>',
  // Emission
  arrow: '<path d="M28 80 L64 44" class="cr-line cr-fat"/><path d="M58 38 L74 34 L70 50 Z"/><path d="M26 72 L32 76 L28 84 Z M34 82 L30 76 L38 78 Z"/>',
  burst: '<path d="M50 34 L55 51 L70 42 L61 57 L78 60 L61 63 L70 78 L55 69 L50 86 L45 69 L30 78 L39 63 L22 60 L39 57 L30 42 L45 51 Z"/>',
  comet: '<circle cx="60" cy="48" r="11"/><path d="M52 56 L28 80 M56 62 L38 82 M48 50 L26 70" class="cr-line"/>',
  lantern: '<path d="M44 36 H56 M41 42 H59 L63 49 V71 L59 78 H41 L37 71 V49 Z"/><path d="M50 51 C55 57 56 62 50 68 C45 62 45 57 50 51 Z" class="cr-pupil"/>',
  bow: '<path d="M38 34 C64 46 64 74 38 86" class="cr-line cr-fat"/><path d="M38 34 V86" class="cr-line"/><path d="M30 60 H70 M64 54 L72 60 L64 66" class="cr-line"/>',
  // Conjuration
  key: '<circle cx="38" cy="50" r="11" class="cr-ring"/><path d="M46 57 L72 82" class="cr-line cr-fat"/><path d="M62 72 L68 66 M67 77 L73 71" class="cr-line"/>',
  book: '<path d="M24 44 Q37 40 50 47 Q63 40 76 44 V78 Q63 74 50 80 Q37 74 24 78 Z"/><path d="M50 47 V80 M30 52 Q38 50 45 54 M30 60 Q38 58 45 62 M55 54 Q62 50 70 52 M55 62 Q62 58 70 60" class="cr-thin"/>',
  chain: '<ellipse cx="38" cy="48" rx="8" ry="12" transform="rotate(-40 38 48)" class="cr-ring"/><ellipse cx="50" cy="60" rx="8" ry="12" transform="rotate(-40 50 60)" class="cr-ring"/><ellipse cx="62" cy="72" rx="8" ry="12" transform="rotate(-40 62 72)" class="cr-ring"/>',
  sword: '<path d="M47 30 H53 L54 66 H46 Z"/><path d="M36 66 H64 V71 H36 Z M47 71 H53 V81 H47 Z"/><circle cx="50" cy="84" r="4"/>',
  mirror: '<ellipse cx="50" cy="52" rx="15" ry="18"/><ellipse cx="50" cy="52" rx="9" ry="12" class="cr-hl"/><path d="M46 70 H54 V86 H46 Z"/>',
  // Manipulation
  strings: '<path d="M28 40 H72 M50 34 V46" class="cr-line cr-fat"/><path d="M34 40 V64 M50 46 V60 M66 40 V64" class="cr-line"/><path d="M50 60 L60 70 L50 82 L40 70 Z"/><circle cx="34" cy="66" r="3"/><circle cx="66" cy="66" r="3"/>',
  rook: '<path d="M35 80 H65 V74 H60 V56 H64 V42 H58 V47 H54 V42 H46 V47 H42 V42 H36 V56 H40 V74 H35 Z"/>',
  crown: '<path d="M28 74 V46 L39 58 L50 40 L61 58 L72 46 V74 Z"/><path d="M28 74 H72 V80 H28 Z"/><circle cx="50" cy="40" r="3"/><circle cx="28" cy="46" r="3"/><circle cx="72" cy="46" r="3"/>',
  web: '<path d="M50 34 V86 M24 60 H76 M32 42 L68 78 M68 42 L32 78" class="cr-line"/><path d="M50 44 L61 49 L66 60 L61 71 L50 76 L39 71 L34 60 L39 49 Z M50 52 L56 54 L58 60 L56 66 L50 68 L44 66 L42 60 L44 54 Z" class="cr-line cr-thin2"/>',
  rose: '<path d="M50 32 L56 54 L78 60 L56 66 L50 88 L44 66 L22 60 L44 54 Z"/><path d="M50 32 L56 54 L50 60 Z M78 60 L56 66 L50 60 Z M50 88 L44 66 L50 60 Z M22 60 L44 54 L50 60 Z" class="cr-hl"/>',
  // Specialization
  eye: '<path d="M22 60 Q50 32 78 60 Q50 88 22 60 Z"/><circle cx="50" cy="60" r="10" class="cr-pupil"/><circle cx="53" cy="57" r="3"/>',
  moon: '<path d="M58 34 A26 26 0 1 0 58 86 A32 32 0 0 1 58 34 Z"/>',
  hourglass: '<path d="M34 34 H66 V40 Q66 53 55 60 Q66 67 66 80 V86 H34 V80 Q34 67 45 60 Q34 53 34 40 Z"/><path d="M42 80 Q50 70 58 80 Z M44 46 H56 Q54 52 50 55 Q46 52 44 46 Z" class="cr-hl"/>',
  moth: '<path d="M50 50 C40 34 22 38 26 54 C29 64 42 62 50 58 C58 62 71 64 74 54 C78 38 60 34 50 50 Z"/><path d="M50 60 C44 64 34 70 38 80 C44 84 49 74 50 68 C51 74 56 84 62 80 C66 70 56 64 50 60 Z"/><path d="M50 46 V76" class="cr-thin"/>',
  eclipse: '<circle cx="50" cy="60" r="22"/><circle cx="56" cy="56" r="17" class="cr-pupil"/>'
};
const CR_BY_NEN = {Enhancement: ['mountain', 'anvil', 'fist', 'ox', 'oak'], Transmutation: ['flame', 'wave', 'bolt', 'serpent', 'feather'], Emission: ['arrow', 'burst', 'comet', 'lantern', 'bow'], Conjuration: ['key', 'book', 'chain', 'sword', 'mirror'], Manipulation: ['strings', 'rook', 'crown', 'web', 'rose'], Specialization: ['eye', 'moon', 'hourglass', 'moth', 'eclipse']};
const CR_BY_WORD = [[/Iron|Anvil/, 'anvil'], [/Oak|Pine|Woods|Forest/, 'oak'], [/Ox|Bull/, 'ox'], [/Stone|Mountain|Crater|Mesas|Ridge|Steppe|Hills|Rock/, 'mountain'], [/Ember|Ash|Smoke|Burning|Cinder/, 'flame'], [/Thunder/, 'bolt'], [/Tide|Coast|Lakes|Falls|Fjords|Bay|Sea|Delta/, 'wave'], [/Silk|Feather/, 'feather'], [/Arrow/, 'arrow'], [/Comet|Starfall/, 'comet'], [/Kite|Echo|Star/, 'burst'], [/Key/, 'key'], [/Ink|Paper|Book/, 'book'], [/Chain/, 'chain'], [/Mirror|Glass/, 'mirror'], [/String|Loom/, 'strings'], [/Compass/, 'rose'], [/Shepherd|Crown/, 'crown'], [/Needle/, 'web'], [/Riddle|Veil/, 'eye'], [/Moth/, 'moth'], [/Dream|Hour/, 'hourglass'], [/Eclipse/, 'eclipse'], [/Lantern/, 'lantern'], [/Bell/, 'bell'], [/Gate/, 'gate']];
CR_CHG.bell = '<path d="M50 36 C39 36 37 48 37 58 C37 67 33 71 30 75 H70 C67 71 63 67 63 58 C63 48 61 36 50 36 Z"/><circle cx="50" cy="81" r="4.5"/><path d="M50 30 V36" class="cr-line"/>';
CR_CHG.gate = '<path d="M30 82 V56 A20 20 0 0 1 70 56 V82 H60 V58 A10 10 0 0 0 40 58 V82 Z"/><path d="M28 82 H72" class="cr-line"/>';
const crHash = s => { let h = 2166136261; for(const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const crRoman = n => { const R = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let o = ''; R.forEach(([v, s]) => { while(n >= v){ o += s; n -= v; } }); return o; };
// the arms themselves: decided once from the root school, so branches can inherit them
function crArms(key, cat, name){
  const h = crHash(key), shapes = Object.keys(CR_SHAPE), word = CR_BY_WORD.find(([re]) => re.test(name || ''));
  const c1 = CR_NEN[cat] || '#d9a640', pool = CR_TINCT.filter(t => t !== c1), c2 = pool[(h >>> 8) % pool.length];
  return {shape: shapes[h % shapes.length], div: CR_DIV[(h >>> 4) % CR_DIV.length], c1, c2, charge: word ? word[1] : CR_BY_NEN[cat] ? CR_BY_NEN[cat][(h >>> 12) % 2] : 'star'};
}
// arms + marks → SVG. o: {key, cat, name, branch: 0|1|2, masters, year, size}
// every drawing gets its own clip id: the same school shown twice (one copy in a hidden tab) would otherwise lose its shield outline
let CR_UID = 0;
function crestSVG(o){
  const A = o.arms || crArms(o.key, o.cat, o.name), id = 'cr' + crHash(o.key + ':' + (o.branch || 0)).toString(36) + '_' + (++CR_UID), S0 = CR_SHAPE[A.shape];
  const field = {
    plain: `<rect width="100" height="120" fill="${A.c1}"/>`,
    pale: `<rect width="50" height="120" fill="${A.c1}"/><rect x="50" width="50" height="120" fill="${A.c2}"/>`,
    fess: `<rect width="100" height="60" fill="${A.c1}"/><rect y="60" width="100" height="60" fill="${A.c2}"/>`,
    quarterly: `<rect width="100" height="120" fill="${A.c1}"/><rect x="50" width="50" height="60" fill="${A.c2}"/><rect y="60" width="50" height="60" fill="${A.c2}"/>`,
    bend: `<rect width="100" height="120" fill="${A.c1}"/><path d="M0 0 L100 120 H0 Z" fill="${A.c2}"/>`,
    chevron: `<rect width="100" height="120" fill="${A.c1}"/><path d="M0 100 L50 50 L100 100 V82 L50 32 L0 82 Z" fill="${A.c2}"/>`,
    chequy: `<rect width="100" height="120" fill="${A.c1}"/>${Array.from({length: 42}, (_, i) => (i % 6 + Math.floor(i / 6)) % 2 ? `<rect x="${(i % 6) * 16.7}" y="${Math.floor(i / 6) * 17.2}" width="16.7" height="17.2" fill="${A.c2}" opacity=".55"/>` : '').join('')}`,
    saltire: `<rect width="100" height="120" fill="${A.c1}"/><path d="M0 0 L50 60 L0 120 Z M100 0 L50 60 L100 120 Z" fill="${A.c2}"/>`,
    gyronny: `<rect width="100" height="120" fill="${A.c1}"/><path d="M50 60 L50 0 H100 Z M50 60 L100 60 V120 Z M50 60 L50 120 H0 Z M50 60 L0 60 V0 Z" fill="${A.c2}"/>`,
    barry: `<rect width="100" height="120" fill="${A.c1}"/>${[0, 1, 2, 3, 4, 5].map(i => i % 2 ? `<rect y="${i * 20}" width="100" height="20" fill="${A.c2}"/>` : '').join('')}`,
    pily: `<rect width="100" height="120" fill="${A.c1}"/><path d="M0 0 H100 L83 60 L67 0 L50 60 L33 0 L17 60 Z" fill="${A.c2}"/>`,
    wavy: `<rect width="100" height="120" fill="${A.c1}"/><path d="M0 58 q12.5 -10 25 0 t25 0 t25 0 t25 0 V120 H0 Z" fill="${A.c2}"/>`,
    chief: `<rect width="100" height="120" fill="${A.c1}"/><rect width="100" height="34" fill="${A.c2}"/>`,
    canton: `<rect width="100" height="120" fill="${A.c1}"/><rect width="42" height="44" fill="${A.c2}"/>`,
    cross: `<rect width="100" height="120" fill="${A.c1}"/><path d="M38 0 H62 V48 H100 V72 H62 V120 H38 V72 H0 V48 H38 Z" fill="${A.c2}"/>`,
    pall: `<rect width="100" height="120" fill="${A.c1}"/><path d="M0 0 L50 54 L100 0 V14 L60 58 V120 H40 V58 L0 14 Z" fill="${A.c2}"/>`
  }[A.div];
  // a mark of difference for branches: a label across the chief, then a bordure
  const label = o.branch >= 1 ? `<path d="M22 24 H78 M30 24 V33 M50 24 V33 M70 24 V33" class="cr-label"/>` : '';
  const bord = o.branch >= 2 ? `<path d="${S0}" class="cr-bord"/>` : '';
  const n = Math.min(5, o.masters || 0), stars = n ? Array.from({length: n}, (_, i) => { const x = 50 + (i - (n - 1) / 2) * 11; return `<path transform="translate(${x} 3) scale(.22)" d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3 Z" class="cr-star"/>`; }).join('') : '';
  const yr = o.year ? `<path d="M14 116 H86 L80 124 L86 132 H14 L20 124 Z" class="cr-rib"/><text x="50" y="127.5" class="cr-yr">${crRoman(o.year)}</text>` : '';
  return `<svg class="crest" viewBox="0 -6 100 ${o.year ? 142 : 126}" width="${o.size || 64}" role="img" aria-label="Crest${o.name ? ' of ' + esc(o.name) : ''}">
    <defs><clipPath id="${id}"><path d="${S0}"/></clipPath></defs>${stars}
    <g clip-path="url(#${id})">${field}</g>
    <g class="cr-chg">${CR_CHG[A.charge] || CR_CHG.star}</g>${label}${bord}
    <path d="${S0}" class="cr-edge"/>${yr}</svg>`;
}
// a school's crest: the root school decides the arms, branches inherit them and add their mark
function schoolCrest(s, size){
  if(!s) return ''; let root = s, depth = 0, guard = 0;
  while(root.parent && guard++ < 6){ const p = schOf(root.parent); if(!p) break; root = p; depth++; }
  return crestSVG({key: s.id + s.name, cat: root.cat, name: s.name, arms: crArmsSchool(s, root), branch: Math.min(2, depth), masters: s.heads ? s.heads.length : 0, year: size >= 80 ? s.ed : null, size});
}

// arms that tell the school's story: the kind of name picks the shape, the history picks the field, the hometown picks the second colour
const CR_SHAPES_BY = {surname: ['mon', 'heater', 'round'], place: ['banner', 'swallowtail', 'arch'], image: ['hexagon', 'lozenge', 'kite', 'octagon']};
const CR_FIELDS = ['plain', 'chief', 'canton', 'bend', 'chevron', 'cross', 'quarterly', 'gyronny', 'pily', 'wavy', 'chequy', 'pall'];
const crKind = name => /-ryū$|^the House of |^the \w+ School$/.test(name) ? 'surname' : /(Style|Way|Breath|Stillness|Hand)$/.test(name) ? 'place' : 'image';
function crArmsSchool(s, root){
  const r = root || s, h = crHash(r.id + r.name), c1 = CR_NEN[r.cat] || '#d9a640';
  const tin = CR_TINCT.filter(t => t !== c1), c2 = tin[crHash(r.home || r.name) % tin.length];   // schools of the same town share a colour
  const shapes = CR_SHAPES_BY[crKind(r.name)], word = CR_BY_WORD.find(([re]) => re.test(r.name)), set = CR_BY_NEN[r.cat] || ['burst'];
  // the field: a school born from a walk-out is split in two, a schism is crossed, an old school earns one stripe per generation
  let div = CR_FIELDS[(h >>> 4) % CR_FIELDS.length];
  if((r.heads || []).length >= 4) div = 'barry';
  if(s !== r || s.parent) div = s.split === 'succession' ? 'saltire' : 'pale';
  else if(r.split === 'left') div = 'fess';
  return {shape: shapes[h % shapes.length], div, c1, c2, charge: word ? word[1] : set[(h >>> 12) % set.length]};
}

/* ---------- relic icons: one line drawing for each of the 34 (64×64, gold stroke) ---------- */
const RELIC_ICON = {
  a0: '<path d="M18 42 C17 30 21 17 30 13 C39 11 45 20 45 31 C45 42 40 50 31 51 C23 52 18 48 18 42 Z"/><path d="M23 25 L39 29 M22 34 L39 37 M24 43 L37 44"/>',
  a1: '<path d="M14 24 H50 V50 H14 Z M22 24 V18 Q22 13 27 13 H37 Q42 13 42 18 V24"/><path d="M14 33 H50 M26 33 V41 H38 V33"/>',
  a2: '<path d="M14 16 H44 Q50 16 50 22 V50 H20 Q14 50 14 44 Z M20 50 Q14 50 14 44 Q14 38 20 38 H50"/><path d="M14 16 Q32 30 50 16" opacity=".6"/>',
  a3: '<path d="M32 50 C20 50 16 40 20 30 C24 20 32 14 32 14 C32 14 40 20 44 30 C48 40 44 50 32 50 Z M32 50 V30"/><path d="M32 38 L26 32 M32 44 L38 37"/>',
  a4: '<path d="M24 14 H40 V26 Q40 30 44 32 H48 V40 H16 V32 H20 Q24 30 24 26 Z M14 40 H50 V48 H14 Z"/>',
  a5: '<path d="M32 12 C22 12 20 24 20 34 C20 42 16 46 14 48 H50 C48 46 44 42 44 34 C44 24 42 12 32 12 Z"/><circle cx="32" cy="53" r="3"/>',
  a6: '<circle cx="25" cy="34" r="12"/><circle cx="39" cy="34" r="12"/>',
  a7: '<path d="M10 22 C24 22 30 42 54 42" /><path d="M10 34 C24 34 30 54 54 54" opacity=".55"/><circle cx="10" cy="22" r="3"/><circle cx="10" cy="34" r="3"/>',
  a8: '<path d="M14 26 Q32 10 50 26 V40 Q32 56 14 40 Z M14 33 H50 M24 18 V46 M40 18 V46"/>',
  a9: '<path d="M26 12 H38 M24 18 H40 L44 24 V44 L40 50 H24 L20 44 V24 Z"/><path d="M32 26 C36 31 36 35 32 40 C28 35 28 31 32 26 Z"/>',
  a10: '<ellipse cx="32" cy="32" rx="9" ry="18"/><path d="M14 20 Q8 32 14 44 M50 20 Q56 32 50 44"/>',
  a11: '<path d="M32 12 V50 M22 50 H42 M16 22 H48 M16 22 L10 36 H22 Z M48 22 L42 36 H54 Z"/>',
  a12: '<circle cx="32" cy="32" r="19"/><path d="M32 46 L36 32 L32 18 L28 32 Z"/><path d="M32 13 V17 M32 47 V51 M13 32 H17 M47 32 H51"/>',
  a13: '<circle cx="32" cy="32" r="18"/><path d="M26 30 Q26 22 32 22 Q38 22 38 30 Q38 34 35 36 V40 H29 V36 Q26 34 26 30 Z M30 30 H30.1 M34 30 H34.1"/>',
  a14: '<path d="M12 24 H28 L26 42 H14 Z M36 24 H52 L50 42 H38 Z"/><path d="M28 28 Q32 20 36 28" stroke-dasharray="2 3"/><path d="M16 50 H24 M40 50 H48"/>',
  a15: '<ellipse cx="22" cy="24" rx="7" ry="10" transform="rotate(-40 22 24)"/><ellipse cx="32" cy="34" rx="7" ry="10" transform="rotate(-40 32 34)"/><ellipse cx="42" cy="44" rx="7" ry="10" transform="rotate(-40 42 44)"/>',
  a16: '<path d="M14 46 C12 36 20 28 32 28 C44 28 52 36 50 46 C48 52 18 53 14 46 Z"/><path d="M24 22 Q22 18 25 14 M32 22 Q30 18 33 14 M40 22 Q38 18 41 14"/>',
  a17: '<path d="M24 12 H40 V18 L44 24 V48 Q44 52 40 52 H24 Q20 52 20 48 V24 L24 18 Z"/><path d="M24 33 H40 M24 39 H34"/>',
  a18: '<path d="M14 18 Q32 10 50 18 Q52 38 32 52 Q12 38 14 18 Z"/><path d="M21 28 Q25 24 29 28 M35 28 Q39 24 43 28 M27 42 Q32 45 37 42"/>',
  a19: '<path d="M32 10 L48 28 L32 42 L16 28 Z M32 10 V42 M16 28 H48"/><path d="M32 42 C30 48 36 50 34 56 M34 50 L38 48 M33 54 L29 52"/>',
  a20: '<path d="M12 44 C22 44 38 36 46 16 L52 20 C46 38 30 50 14 52 Z"/><path d="M48 18 L54 12"/>',
  a21: '<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="14"/><path d="M22 28 Q28 24 32 30 T42 30 M24 38 Q30 34 34 38"/>',
  s1: '<path d="M18 50 V30 Q18 20 28 20 H40 Q46 20 46 26 V50 Z"/><path d="M40 20 C52 14 56 28 46 30 C40 31 40 24 46 24"/>',
  s2: '<path d="M22 18 H42 L46 46 H18 Z M28 18 V12 H36 V18"/><circle cx="32" cy="50" r="3"/>',
  s3: '<circle cx="24" cy="36" r="11"/><circle cx="40" cy="36" r="11"/><path d="M32 25 V14 M28 14 H36"/>',
  s4: '<path d="M14 40 Q14 16 32 14 Q50 16 50 40 Z M14 40 H50 M22 40 V48 M42 40 V48"/><path d="M10 26 Q8 18 14 16 M54 26 Q56 18 50 16"/>',
  s5: '<path d="M18 10 V54 M18 12 H48 L42 22 L48 32 H18"/>',
  s6: '<path d="M22 52 L30 38 M30 38 C24 26 30 12 46 12 C38 16 34 24 38 34 Z"/>',
  s7: '<path d="M14 14 L50 50 M22 14 L50 42 M14 22 L42 50"/><path d="M14 14 H22 L14 22 Z"/>',
  s8: '<path d="M32 10 V40 C32 50 22 54 18 46 C16 42 20 38 24 40"/><circle cx="32" cy="10" r="3"/>',
  s9: '<path d="M22 10 C46 22 46 42 22 54 M22 10 V54"/><path d="M14 32 H50 M44 26 L52 32 L44 38"/>',
  s10: '<path d="M32 14 V52 M24 22 H40 M14 40 Q16 52 32 52 Q48 52 50 40 M14 40 L10 44 M50 40 L54 44"/><circle cx="32" cy="12" r="4"/>',
  s11: '<path d="M22 20 Q18 30 22 40 Q24 50 32 52 Q40 50 42 40 Q46 30 42 20 Z M22 20 H42 M42 24 Q52 24 50 34 Q48 40 42 40 M22 22 L14 16"/>',
  s12: '<path d="M10 16 H54 L48 50 H16 Z M18 16 L24 50 M32 16 V50 M46 16 L40 50 M12 27 H52 M14 38 H50"/>'
};
const relicIcon = (id, size) => `<svg class="rl-ic" viewBox="0 0 64 64" width="${size || 40}" height="${size || 40}" aria-hidden="true">${RELIC_ICON[id] || ''}</svg>`;
