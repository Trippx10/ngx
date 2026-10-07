(() => {
'use strict';

/* =========================================================
   helpers
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const f1 = n => n.toFixed(1);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
let UID = 0;
function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); const c = [n >> 16, n >> 8 & 255, n & 255];
  return '#' + c.map(v => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255).toString(16).padStart(2, '0')).join('');
}
let toastT;
function toast(msg, ms = 3400) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
const lock = on => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

/* Moscow wall-clock time */
function msk() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })); }
const HOURS = { 0: [11, 20], 1: [10, 22], 2: [10, 22], 3: [10, 22], 4: [10, 22], 5: [10, 22], 6: [10, 22] };

/* =========================================================
   Чубик — the mascot (SVG generator)
   ========================================================= */
const STYLES = {
  shaggy:   { n: 12, amp: 13, inner: 3, smooth: true },
  hedgehog: { n: 22, amp: 8, inner: 1, smooth: false },
  mohawk:   { n: 9, amp: 26, inner: 0, smooth: false, top: true },
  bowl:     { n: 16, amp: 2.5, inner: 0, smooth: true, bowl: true },
  curly:    { n: 10, amp: 9, inner: 1, smooth: true },
  bald:     { n: 16, amp: 0, inner: 0, smooth: true }
};
function hairPath(style, seed) {
  const c = STYLES[style] || STYLES.shaggy, r = rng(seed * 97 + style.length * 13);
  const cx = 70, cy = 70, R = 44, N = c.n * 2, pts = [];
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + i / N * Math.PI * 2;
    const bottom = Math.max(0, Math.sin(a));
    let amp = c.amp * (.7 + r() * .45) * (1 - bottom * .8);
    if (c.top) { const up = Math.sin(a) < 0 ? 1 - Math.abs(Math.cos(a)) : 0; amp = up > .3 ? c.amp * (.5 + up * .6) * (.8 + r() * .3) : 1.2; }
    let rad = i % 2 === 0 ? R + amp : R - c.inner * (1 - bottom);
    if (c.bowl) rad = R + (Math.sin(a) < .15 ? 4 : 0) + (i % 2 ? 0 : c.amp);
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  if (!c.smooth) return 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const s = mid(pts[N - 1], pts[0]); let d = `M${f1(s[0])} ${f1(s[1])}`;
  for (let i = 0; i < N; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % N]); d += `Q${f1(p[0])} ${f1(p[1])} ${f1(m[0])} ${f1(m[1])}`; }
  return d + 'Z';
}
function chubik(o = {}) {
  const style = o.style || 'shaggy', seed = +o.seed || 4, mood = o.mood || 'normal', d = hairPath(style, seed);
  return `<svg class="chubik" viewBox="0 0 140 140" data-style="${style}" data-mood="${mood}"${o.track === false ? '' : ' data-track'}${o.attrs || ''} aria-hidden="true" focusable="false">
<g class="c-legs"><g class="leg l"><path d="M58 104 L56 126"/><ellipse cx="52" cy="129" rx="8" ry="4.6"/></g><g class="leg r"><path d="M82 104 L84 126"/><ellipse cx="88" cy="129" rx="8" ry="4.6"/></g></g>
<g class="c-body">
<path class="c-hair2" d="${d}" transform="translate(0 4)"/><path class="c-hair" d="${d}"/>
<path class="c-curl" d="M64 30 C 56 8, 86 -2, 91 13 C 94 24, 81 27, 79 18"/>
<ellipse class="c-shine" cx="50" cy="44" rx="12" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 50 44)"/>
<g class="c-face">
<ellipse class="cheek" cx="42" cy="88" rx="6.5" ry="3.6"/><ellipse class="cheek" cx="98" cy="88" rx="6.5" ry="3.6"/>
<g class="e-normal"><ellipse class="ew" cx="56" cy="76" rx="9.5" ry="11"/><ellipse class="ew" cx="84" cy="76" rx="9.5" ry="11"/><g class="pupils"><circle cx="56" cy="77" r="4.8"/><circle cx="84" cy="77" r="4.8"/><circle class="hl" cx="58" cy="74.6" r="1.6"/><circle class="hl" cx="86" cy="74.6" r="1.6"/></g></g>
<g class="e-happy"><path class="stroke" d="M47 79 q9 -12 18 0"/><path class="stroke" d="M75 79 q9 -12 18 0"/></g>
<g class="e-shock"><circle class="ew" cx="56" cy="75" r="11.5"/><circle class="ew" cx="84" cy="75" r="11.5"/><circle class="p" cx="56" cy="75" r="2.8"/><circle class="p" cx="84" cy="75" r="2.8"/></g>
<g class="e-sleep"><path class="stroke" d="M47 78 q9 6 18 0"/><path class="stroke" d="M75 78 q9 6 18 0"/></g>
<path class="stroke m-smile" d="M62 93 q8 8 16 0"/><ellipse class="m-o" cx="70" cy="96" rx="4.2" ry="5.2"/><path class="stroke m-flat" d="M65 95 h10"/>
</g></g>
<g class="c-sc" transform="translate(113 94) rotate(-35)"><g class="sc-b sc-a"><path d="M0 0 L24 -2.5 L24 .5 L0 3 Z"/><circle cx="-8" cy="-4.5" r="4.6"/></g><g class="sc-b sc-z"><path d="M0 0 L24 2.5 L24 -.5 L0 -3 Z"/><circle cx="-8" cy="4.5" r="4.6"/></g></g>
</svg>`;
}
function setHair(svg, style, seed) {
  const d = hairPath(style, seed);
  $('.c-hair', svg).setAttribute('d', d); $('.c-hair2', svg).setAttribute('d', d);
  svg.dataset.style = style;
}
function mountChubiks(root = document) {
  $$('[data-chubik]', root).forEach(el => {
    if (el.dataset.m) return; el.dataset.m = '1';
    el.innerHTML = chubik({ style: el.dataset.style, seed: el.dataset.seed, mood: el.dataset.mood, track: !('notrack' in el.dataset) });
  });
}

/* =========================================================
   Illustrated portraits (masters, works, avatars)
   ========================================================= */
function hairShapes(st, c, id, seed) {
  let back = '', front = '';
  const crop = `<path d="M86 184 C 80 112, 118 92, 152 94 C 190 96, 222 118, 214 184 C 210 164, 204 154, 198 148 L188 160 L180 146 L170 160 L160 144 L150 160 L140 144 L130 160 L120 146 L110 158 C 100 162, 92 170, 86 184 Z" fill="${c}"/>`;
  const r = rng(seed || 1);
  switch (st) {
    case 'buzz': front = `<path d="M88 186 C 86 124, 118 108, 150 108 C 182 108, 214 124, 212 186 C 206 158, 194 142, 150 140 C 106 142, 94 158, 88 186 Z" fill="${c}"/>`; break;
    case 'crop': front = crop; break;
    case 'pomp': front = `<path d="M88 182 C 80 122, 96 64, 150 54 C 204 46, 236 82, 214 122 C 216 142, 215 162, 212 182 C 206 152, 196 136, 170 132 C 130 130, 100 142, 88 182 Z" fill="${c}"/>`; break;
    case 'fade': front = `<path d="M85 216 C 80 168, 84 122, 110 98 C 132 80, 172 78, 196 96 C 220 116, 220 168, 215 216 L203 216 C 203 186, 199 152, 180 138 C 164 128, 136 128, 120 138 C 101 152, 97 186, 97 216 Z" fill="${c}"/>`; break;
    case 'mullet': back = `<path d="M92 170 C 82 240, 88 290, 106 314 L194 314 C 212 290, 218 240, 208 170 Z" fill="${c}"/>`; front = crop; break;
    case 'long': back = `<path d="M80 184 C 72 104, 110 86, 150 86 C 190 86, 228 104, 220 184 L232 336 C 196 352, 104 352, 68 336 Z" fill="${c}"/>`; front = `<path d="M86 178 C 88 112, 128 92, 160 94 C 202 98, 218 132, 214 180 C 198 144, 170 126, 140 130 C 116 134, 98 152, 86 178 Z" fill="${c}"/>`; break;
    case 'mohawk': front = `<path d="M137 146 C 130 96, 140 50, 150 28 C 160 50, 170 96, 163 146 Z" fill="${c}"/>`; break;
    case 'curly': {
      let s = '';
      for (let i = 0; i < 26; i++) { const a = Math.PI * (1.02 + i / 25 * .96), rr = 62 + r() * 16; s += `<circle cx="${f1(150 + Math.cos(a) * rr * 1.05)}" cy="${f1(176 + Math.sin(a) * rr * 1.1)}" r="${f1(15 + r() * 8)}" fill="${c}"/>`; }
      for (let i = 0; i < 8; i++) s += `<circle cx="${f1(112 + i * 11 + r() * 6)}" cy="${f1(138 + r() * 14)}" r="${f1(13 + r() * 6)}" fill="${c}"/>`;
      front = s; break;
    }
    case 'messy': {
      let d = 'M80 214 ';
      for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI, rr = i % 2 ? 96 + r() * 24 : 76 + r() * 6; d += `L${f1(150 + Math.cos(a) * rr)} ${f1(180 + Math.sin(a) * rr * 1.05)} `; }
      d += 'L220 214 L214 176 ';
      for (let i = 1; i <= 9; i++) { const x = 214 - i * (128 / 9); d += `L${f1(x)} ${f1(i % 2 ? 168 + r() * 16 : 146 + r() * 8)} `; }
      d += 'L86 176 Z';
      back = `<path d="M78 190 C 70 262, 76 302, 96 324 L204 324 C 224 302, 230 262, 222 190 Z" fill="${c}"/>`;
      front = `<path d="${d}" fill="${c}"/>`; break;
    }
  }
  return { back, front };
}
function beardShape(t, c) {
  if (!t || t === 'none') return { body: '', must: '' };
  const must = `<path d="M124 234 C 134 224, 148 228, 150 232 C 152 228, 166 224, 176 234 C 166 240, 154 236, 150 236 C 146 236, 134 240, 124 234 Z" fill="${c}"/>`;
  const shapes = {
    stubble: `<path d="M92 204 C 94 262, 120 280, 150 282 C 180 280, 206 262, 208 204 C 200 238, 186 254, 150 256 C 114 254, 100 238, 92 204 Z" fill="${c}"/>`,
    short: `<path d="M90 198 C 92 264, 120 286, 150 288 C 180 286, 208 264, 210 198 C 200 238, 186 256, 150 258 C 114 256, 100 238, 90 198 Z" fill="${c}"/>`,
    full: `<path d="M88 192 C 86 282, 120 322, 150 324 C 180 322, 214 282, 212 192 C 202 240, 188 262, 150 264 C 112 262, 98 240, 88 192 Z" fill="${c}"/>`,
    huge: `<path d="M84 186 C 72 300, 116 368, 150 372 C 184 368, 228 300, 216 186 C 206 244, 190 266, 150 268 C 110 266, 94 244, 84 186 Z" fill="${c}"/>`
  };
  return { body: shapes[t] || '', must: t === 'stubble' ? '' : must };
}
function portrait(o) {
  const id = 'pt' + (++UID), skin = o.skin || '#f2c9a8', sd = shade(skin, -.14), hair = o.hair || '#1a1622';
  const bg = o.bg || '#282335', patc = o.patc || 'rgba(238,234,246,.09)', shirt = o.shirt || '#eeeaf6';
  let pat = '';
  if (o.pat === 'rings') for (let r = 40; r < 440; r += 26) pat += `<circle cx="150" cy="190" r="${r}" fill="none" stroke="${patc}" stroke-width="2"/>`;
  else if (o.pat === 'dots') pat = `<defs><pattern id="${id}d" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2.2" fill="${patc}"/></pattern></defs><rect x="-50" y="-50" width="400" height="500" fill="url(#${id}d)"/>`;
  else if (o.pat === 'stripes') pat = `<defs><pattern id="${id}s" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="13" height="26" fill="${patc}"/></pattern></defs><rect x="-50" y="-50" width="400" height="500" fill="url(#${id}s)"/>`;
  else if (o.pat === 'grid') pat = `<defs><pattern id="${id}g" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${patc}" stroke-width="1.5"/></pattern></defs><rect x="-50" y="-50" width="400" height="500" fill="url(#${id}g)"/>`;
  else if (o.pat === 'sun') for (let a = 0; a < 360; a += 12) { const A = a * Math.PI / 180, B = (a + 5) * Math.PI / 180; pat += `<path d="M150 190 L${f1(150 + Math.cos(A) * 520)} ${f1(190 + Math.sin(A) * 520)} L${f1(150 + Math.cos(B) * 520)} ${f1(190 + Math.sin(B) * 520)} Z" fill="${patc}"/>`; }
  const H = hairShapes(o.style, hair, id, o.seed || 3), B = beardShape(o.beard, o.beardColor || hair);
  const brow = o.brow || (hair === '#ff5fa2' ? '#d93d80' : shade(hair, -.1));
  return `<svg class="pt${o.smile ? ' smile' : ''}" viewBox="${o.vb || '0 0 300 400'}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<rect x="-50" y="-50" width="400" height="500" fill="${bg}"/>${pat}
<path d="M26 420 C 36 320, 98 296, 150 296 C 202 296, 264 320, 274 420 Z" fill="${shirt}"/>
${H.back}
<path d="M126 236 L126 306 Q150 322 174 306 L174 236 Z" fill="${sd}"/>
<path d="M120 302 L150 334 L180 302" fill="none" stroke="${shade(shirt, -.3)}" stroke-width="4" stroke-linejoin="round"/>
<ellipse cx="88" cy="196" rx="11" ry="17" fill="${sd}"/><ellipse cx="212" cy="196" rx="11" ry="17" fill="${sd}"/>
${o.earring ? '<circle cx="212" cy="218" r="5.5" fill="none" stroke="#ff5fa2" stroke-width="3"/>' : ''}
<ellipse cx="150" cy="190" rx="62" ry="78" fill="${skin}"/>
${B.body}${H.front}
<path d="M116 176 q12 -7 24 -1 M160 175 q12 -6 24 1" fill="none" stroke="${brow}" stroke-width="4.5" stroke-linecap="round"/>
<circle cx="128" cy="195" r="4.6" fill="#121019"/><circle class="pe-r" cx="172" cy="195" r="4.6" fill="#121019"/>
<path class="pe-wink" d="M164 197 q8 -6 16 0" fill="none" stroke="#121019" stroke-width="3.4" stroke-linecap="round"/>
${o.glasses ? '<g fill="none" stroke="#121019" stroke-width="3.5"><circle cx="128" cy="195" r="16"/><circle cx="172" cy="195" r="16"/><path d="M144 193 q6 -5 12 0 M112 191 L92 186 M188 191 L208 186"/></g>' : ''}
<path d="M150 202 q-7 20 1 26 q4 2 8 -1" fill="none" stroke="${sd}" stroke-width="3.2" stroke-linecap="round"/>
<path class="pm-n" d="M137 247 q13 5 26 0" fill="none" stroke="#121019" stroke-width="3.4" stroke-linecap="round"/>
<path class="pm-s" d="M132 243 q18 18 36 0 Z" fill="#121019"/>
${B.must}
</svg>`;
}

/* =========================================================
   Data
   ========================================================= */
const TEAM = [
  { name: 'Лев Корнеев', short: 'Лев', to: 'Льву', role: 'Классика ножницами', exp: '11 лет', spec: 'Классика, помпадур, стрижки только ножницами', quote: 'Стрижёт без машинки, если попросишь. И даже если не попросишь.', stk: 'ножницы only',
    p: { bg: '#2b2438', pat: 'rings', skin: '#f2c9a8', hair: '#4a2f25', style: 'pomp', beard: 'short', shirt: '#eeeaf6', glasses: true } },
  { name: 'Марат Ибрагимов', short: 'Марат', to: 'Марату', role: 'Фейды и скин-фейды', exp: '7 лет', spec: 'Фейды, кропы, текстура, дизайн триммером', quote: 'Переход от нуля до трёх миллиметров делает за три движения. Мы засекали.', stk: 'от 0,5 мм',
    p: { bg: '#ff5fa2', pat: 'dots', patc: 'rgba(18,16,25,.16)', skin: '#b87a55', hair: '#1a1622', style: 'fade', beard: 'full', shirt: '#121019' } },
  { name: 'Ника Орлова', short: 'Ника', to: 'Нике', role: 'Текстура, маллеты, длина', exp: '6 лет', spec: 'Маллеты, шэги, текстурные и длинные стрижки', quote: 'Вернула маллетам достоинство. Трём клиентам заодно вернула уверенность.', stk: 'маллет-активист',
    p: { bg: '#eeeaf6', pat: 'stripes', patc: 'rgba(18,16,25,.06)', skin: '#f2c9a8', hair: '#ff5fa2', style: 'long', shirt: '#342d45', earring: true } },
  { name: 'Тимур Галиев', short: 'Тимур', to: 'Тимуру', role: 'Борода и опасное бритьё', exp: '9 лет', spec: 'Бороды, бритьё головы, горячее полотенце', quote: 'Горячее полотенце держит ровно три минуты. По секундомеру, без исключений.', stk: 'опасная бритва',
    p: { bg: '#342d45', pat: 'grid', skin: '#dda27c', hair: '#1a1622', style: 'buzz', beard: 'huge', shirt: '#ff5fa2' } }
];
const WORKS = [
  { t: 'Мид-фейд и текстурный кроп', m: 'Марат', time: '50 мин', tools: 'машинка, насадки 0,5 / 1,5 / 3 мм', rot: '-1.2deg', before: { style: 'curly', beard: 'stubble' }, after: { style: 'fade' }, base: { skin: '#dda27c', hair: '#1a1622', bg: '#ff5fa2', pat: 'dots', patc: 'rgba(18,16,25,.16)', shirt: '#121019', seed: 4 } },
  { t: 'Помпадур на классике', m: 'Лев', time: '70 мин', tools: 'ножницы, фен, помада средней фиксации', rot: '1deg', before: { style: 'messy' }, after: { style: 'pomp' }, base: { skin: '#f2c9a8', hair: '#4a2f25', bg: '#282335', pat: 'rings', shirt: '#eeeaf6', seed: 7 } },
  { t: 'Маллет 2026', m: 'Ника', time: '60 мин', tools: 'ножницы, филировка, солевой спрей', rot: '2deg', before: { style: 'long' }, after: { style: 'mullet' }, base: { skin: '#f2c9a8', hair: '#d8b36a', bg: '#eeeaf6', pat: 'stripes', patc: 'rgba(18,16,25,.06)', shirt: '#ff5fa2', seed: 2 } },
  { t: 'Борода: из лопаты в форму', m: 'Тимур', time: '45 мин', tools: 'триммер, опасная бритва, горячее полотенце', rot: '-1.5deg', before: { style: 'buzz', beard: 'huge' }, after: { style: 'buzz', beard: 'short' }, base: { skin: '#b87a55', hair: '#1a1622', bg: '#342d45', pat: 'grid', shirt: '#eeeaf6', seed: 9 } },
  { t: 'Базз-кат 6 мм', m: 'Марат', time: '30 мин', tools: 'машинка, насадка 6 мм, окантовка триммером', rot: '1.4deg', before: { style: 'messy' }, after: { style: 'buzz' }, base: { skin: '#8d5b3d', hair: '#1a1622', bg: '#eeeaf6', pat: 'sun', patc: 'rgba(18,16,25,.05)', shirt: '#342d45', seed: 11 } },
  { t: 'Кудри под контролем', m: 'Ника', time: '60 мин', tools: 'ножницы, стрижка по сухим кудрям', rot: '-2deg', before: { style: 'messy', beard: 'stubble' }, after: { style: 'curly' }, base: { skin: '#dda27c', hair: '#4a2f25', bg: '#282335', pat: 'dots', shirt: '#ff5fa2', seed: 5 } },
  { t: 'Детская «как у папы»', m: 'Лев', time: '35 мин', tools: 'ножницы, тихая машинка, наклейка «Храбрец»', rot: '1.8deg', before: { style: 'messy' }, after: { style: 'crop' }, base: { skin: '#f2c9a8', hair: '#d8b36a', bg: '#ff5fa2', pat: 'rings', patc: 'rgba(18,16,25,.1)', shirt: '#eeeaf6', seed: 13 } },
  { t: 'Ирокез без фанатизма', m: 'Ника', time: '55 мин', tools: 'машинка, насадка 1,5 мм, текстурирующая паста', rot: '-1deg', before: { style: 'crop' }, after: { style: 'mohawk' }, base: { skin: '#dda27c', hair: '#ff5fa2', bg: '#342d45', pat: 'grid', shirt: '#eeeaf6', seed: 6 } }
];
const REVIEWS = [
  { n: 'Артём К.', s: 'Фейд + текстура · Марат', q: 'Пришёл с фото из интернета, ушёл с причёской лучше, чем на фото. Марат спорил со мной десять минут и оказался прав.', p: { skin: '#dda27c', hair: '#1a1622', style: 'fade', bg: '#ff5fa2' } },
  { n: 'Денис В.', s: 'Борода · Тимур', q: 'Впервые за пять лет борода растёт в одну сторону. Отдельное спасибо горячему полотенцу.', p: { skin: '#f2c9a8', hair: '#4a2f25', style: 'buzz', beard: 'full', bg: '#342d45' } },
  { n: 'Ильдар Ш.', s: 'Детская · Лев', q: 'Сын теперь сам просится в барбершоп. Говорит, там живёт розовый монстр. Я не спорю.', p: { skin: '#b87a55', hair: '#1a1622', style: 'crop', beard: 'short', bg: '#eeeaf6' } },
  'buddy',
  { n: 'Роман Л.', s: 'Маллет · Ника', q: 'Хотел маллет, но боялся. На работе спросили, где я стригусь, а не что со мной случилось.', p: { skin: '#f2c9a8', hair: '#d8b36a', style: 'mullet', bg: '#282335' } },
  { n: 'Кирилл П.', s: 'Комплекс · Лев', q: 'Кофе лучше, чем в кофейне напротив. Стрижка тоже, но это было ожидаемо.', p: { skin: '#dda27c', hair: '#4a2f25', style: 'pomp', beard: 'stubble', bg: '#ff5fa2' } },
  { n: 'Сергей М.', s: 'Стрижка · Марат', q: 'Записался на 19:15, сел в кресло в 19:14. Такого со мной в Москве ещё не было.', p: { skin: '#8d5b3d', hair: '#1a1622', style: 'buzz', bg: '#342d45' } }
];
const SVC = [['Короткая стрижка', 2400, 60], ['Длинные волосы', 2900, 75], ['Классика ножницами', 2700, 70], ['Борода', 1900, 45], ['Комплекс', 3900, 90], ['Детская', 1600, 40]];
const MASTERS = ['Любой', 'Лев', 'Марат', 'Ника', 'Тимур'];

/* =========================================================
   Render static-ish content
   ========================================================= */
$('#team').innerHTML = TEAM.map(m => `
<article class="bar" tabindex="0" aria-label="${m.name}, ${m.role}">
  <div class="bar-pic">${portrait(m.p)}</div>
  <span class="bar-stk">${m.stk}</span>
  <div class="bar-cap"><p class="bar-name">${m.short}</p><p class="bar-role">${m.role}</p></div>
  <div class="bar-info">
    <h3>${m.name}</h3>
    <dl><dt>Стаж</dt><dd>${m.exp}</dd><dt>Делает</dt><dd>${m.spec}</dd></dl>
    <q>${m.quote}</q>
    <button class="btn btn-sm js-book" data-master="${m.short}">Записаться к ${m.to}</button>
  </div>
</article>`).join('');

if ($('#works')) $('#works').innerHTML = WORKS.map((w, i) => `
<button class="work" style="--rot:${w.rot}" data-i="${i}" aria-label="Открыть работу: ${w.t}">
  <span class="work-img">${portrait({ ...w.base, ...w.after, smile: true })}</span>
  <span class="work-cap"><span>${w.t} · ${w.m}</span><i aria-hidden="true">+</i></span>
</button>`).join('');

$('#rvTrack').innerHTML = REVIEWS.map(r => r === 'buddy'
  ? `<article class="rv buddy-card"><div data-chubik data-style="curly" data-mood="happy" data-seed="12"></div><p>«Меня тут тоже стригли. Трижды. Сегодня.»</p><small>Чубик · постоянный клиент</small></article>`
  : `<article class="rv"><p class="rv-q">${r.q}</p><div class="rv-who"><div class="rv-ava">${portrait({ ...r.p, smile: true, vb: '72 96 156 156' })}</div><div><p class="rv-name">${r.n}</p><p class="rv-svc">${r.s}</p></div><span class="rv-score">5 / 5</span></div></article>`).join('');

$$('[data-tape]').forEach(t => {
  const sc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M8.5 16.5 21 8M8.5 7.5 21 16"/></svg>';
  const html = t.dataset.tape.split('|').map(s => `<span>${s}${sc}</span>`).join('');
  t.innerHTML = html + html + html + html;
});

mountChubiks();

/* split hero lines into letters */
{ let k = 0; $$('[data-fit]').forEach(el => { const t = el.textContent; el.textContent = ''; [...t].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--d', k++); s.textContent = ch; el.appendChild(s); }); }); }
function fitAll() {
  $$('[data-fit]').forEach(el => {
    el.style.fontSize = '100px';
    const w = el.getBoundingClientRect().width || 1;
    let avail = el.parentElement.clientWidth;
    if ('fitRest' in el.dataset) { const gap = parseFloat(getComputedStyle(el.parentElement).columnGap) || 0; avail -= $('#mirror').offsetWidth + gap; }
    el.style.fontSize = Math.min('fitRest' in el.dataset ? 265 : 210, 100 * avail / w * .99) + 'px';
  });
}
fitAll();
addEventListener('resize', debounce(fitAll, 120));

/* =========================================================
   Eyes follow the cursor + random blinks
   ========================================================= */
let mx = innerWidth / 2, my = innerHeight / 3, eyeRaf = 0;
function updEyes() {
  eyeRaf = 0;
  for (const s of document.querySelectorAll('svg.chubik[data-track]')) {
    const r = s.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
    const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * .55), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 240) * 3.4;
    const flip = s.closest('.flip') ? -1 : 1, p = s.querySelector('.pupils');
    if (p) p.style.transform = `translate(${(dx / d * k * flip).toFixed(2)}px,${(dy / d * k).toFixed(2)}px)`;
  }
}
addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!eyeRaf) eyeRaf = requestAnimationFrame(updEyes); }, { passive: true });
addEventListener('scroll', () => { if (!eyeRaf) eyeRaf = requestAnimationFrame(updEyes); }, { passive: true });
setInterval(() => {
  if (document.hidden) return;
  const list = $$('svg.chubik').filter(s => s.dataset.mood === 'normal' && s.getBoundingClientRect().width);
  for (let i = 0; i < 2 && list.length; i++) { const s = pick(list); s.classList.add('blink'); setTimeout(() => s.classList.remove('blink'), 150); }
}, 1900);

/* =========================================================
   Roaming Чубик
   ========================================================= */
const Buddy = (() => {
  const el = $('#buddy'), bub = $('#bubble');
  $('#buddyBody').innerHTML = chubik({ style: 'shaggy', seed: 4 });
  const svg = $('svg', el);
  const PEEK = ['Сегодня вечером есть окна!', 'Жми, я подержу ножницы.', 'Запись за 30 секунд. Я засекал.', 'Лев как раз освободился.'];
  const POKE = ['Эй! Я на смене.', 'Щекотно!', 'Не отвлекай, я точу ножницы.', 'Осторожно, я линяю.'];
  const HINTS = ['Пс-с. Нажми на меня в зеркале наверху, я хочу новую причёску.', 'Тут есть мини-игра. Кнопка «Поиграть» на первом экране.', 'В самом низу сайта я сплю. Разбуди меня пять раз, будет подарок.'];
  const FACTS = ['На голове в среднем 100 000 волос. Мы проверяли только у Льва.', 'Я тоже когда-то был короткой стрижкой.', 'Ножницы здесь точат по пятницам. Не отвлекайте Льва.'];
  let busy = false, gen = 0, anim = null, tmo = [], cool = 0, peekBtn = null, lastPeek = 0, pokes = 0, pos = { x: -300, y: 0 };
  const S = () => el.offsetWidth || 100;
  const mood = m => { svg.dataset.mood = m; };
  const tf = (x, y, extra = '') => `translate(${x}px,${y}px) ${extra}`;
  const T = (fn, ms) => { tmo.push(setTimeout(fn, ms)); };
  function begin() { busy = true; return ++gen; }
  function reset() { gen++; tmo.forEach(clearTimeout); tmo = []; anim?.cancel(); anim = null; el.className = 'buddy'; bub.classList.remove('show'); svg.classList.remove('snip'); mood('normal'); busy = false; cool = Date.now(); peekBtn = null; }
  const end = g => { if (g === gen) reset(); };
  function go(frames, opt) { anim?.cancel(); anim = el.animate(frames, { fill: 'forwards', ...opt }); return anim.finished.catch(() => {}); }
  function say(txt, ms = 2800) {
    bub.textContent = txt; bub.style.setProperty('--bx', '0px');
    const w = bub.offsetWidth, cx = pos.x + S() / 2; let sh = 0;
    if (cx - w / 2 < 10) sh = 10 - (cx - w / 2); else if (cx + w / 2 > innerWidth - 10) sh = innerWidth - 10 - (cx + w / 2);
    bub.style.setProperty('--bx', sh + 'px'); bub.classList.add('show');
    if (ms) T(() => bub.classList.remove('show'), ms);
  }
  async function runAcross(o = {}) {
    if (busy || RM) return; const g = begin();
    const s = S(), y = innerHeight - s * .95, ltr = o.ltr ?? Math.random() < .65;
    const a = ltr ? -s - 10 : innerWidth + 10, b = ltr ? innerWidth + 10 : -s - 10, mid = innerWidth / 2 - s / 2;
    const dur = clamp(innerWidth * 2.1, 1500, 3400);
    el.classList.add('on', 'running'); el.classList.toggle('flip', !ltr); pos = { x: mid, y };
    if (o.stop) {
      await go([{ transform: tf(a, y) }, { transform: tf(mid, y) }], { duration: dur * .5, easing: 'cubic-bezier(.3,.1,.55,1)' }); if (g !== gen) return;
      el.classList.remove('running'); mood('happy'); say(o.stop, 2100); svg.classList.add('snip');
      await sleep(2300); if (g !== gen) return;
      svg.classList.remove('snip'); mood('normal'); el.classList.add('running');
      await go([{ transform: tf(mid, y) }, { transform: tf(b, y) }], { duration: dur * .5, easing: 'cubic-bezier(.45,0,.7,.9)' });
    } else await go([{ transform: tf(a, y) }, { transform: tf(b, y) }], { duration: dur, easing: 'linear' });
    end(g);
  }
  function peek(btn) {
    if (busy || RM || !FINE || Date.now() - lastPeek < 7000 || blocked()) return;
    const g = begin(); lastPeek = Date.now(); peekBtn = btn;
    const r = btn.getBoundingClientRect(), s = S(); let x = r.right - s * .42, flip = false;
    if (x + s > innerWidth - 6) { x = r.left - s * .58; flip = true; }
    let y = r.top - s * .8, top = true; if (y < 70) { y = r.bottom - s * .12; top = false; }
    pos = { x, y }; el.classList.add('on'); el.classList.toggle('flip', flip); mood('happy');
    go([{ transform: tf(x, y + s * .4, 'scale(.3) rotate(-20deg)'), opacity: 0 }, { transform: tf(x, y, 'scale(1)'), opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    svg.classList.add('snip'); T(() => svg.classList.remove('snip'), 900);
    if (top && y > 110) T(() => { if (g === gen) say(pick(PEEK), 0); }, 250);
  }
  function unpeek() {
    if (!peekBtn) return; const g = gen; peekBtn = null; bub.classList.remove('show');
    go([{ transform: tf(pos.x, pos.y), opacity: 1 }, { transform: tf(pos.x, pos.y + S() * .4, 'scale(.3)'), opacity: 0 }], { duration: 260, easing: 'ease-in' }).then(() => end(g));
  }
  async function drop(text) {
    if (busy || RM || blocked()) return; const g = begin();
    const s = S(), right = innerWidth < 760 || Math.random() < .6;
    const x = right ? innerWidth - s - (innerWidth < 760 ? 8 : innerWidth * .04) : innerWidth * .04, y = clamp(innerHeight * .2, 90, 200);
    pos = { x, y }; el.classList.add('on', 'hang'); mood('shock');
    await go([{ transform: tf(x, -s * 1.7) }, { transform: tf(x, y) }], { duration: 950, easing: 'cubic-bezier(.25,1.45,.5,1)' }); if (g !== gen) return;
    mood('happy'); say(text, 2900); await sleep(3200); if (g !== gen) return;
    mood('normal'); await go([{ transform: tf(x, y) }, { transform: tf(x, -s * 1.9) }], { duration: 650, easing: 'cubic-bezier(.6,0,.8,.4)' });
    end(g);
  }
  async function edge(text, ms = 4200) {
    if (busy || blocked()) return; const g = begin();
    const s = S(), left = Math.random() < .35, y = innerHeight * rand(.42, .6);
    const xin = left ? -s * .4 : innerWidth - s * .6, xout = left ? -s - 12 : innerWidth + 12, rot = left ? 'rotate(20deg)' : 'rotate(-20deg)';
    pos = { x: xin, y }; el.classList.add('on'); el.classList.toggle('flip', !left); mood(text ? 'happy' : 'normal');
    await go([{ transform: tf(xout, y, rot) }, { transform: tf(xin, y, rot) }], { duration: RM ? 1 : 650, easing: 'cubic-bezier(.34,1.56,.64,1)' }); if (g !== gen) return;
    if (text) say(text, ms - 400);
    await sleep(ms); if (g !== gen) return;
    await go([{ transform: tf(xin, y, rot) }, { transform: tf(xout, y, rot) }], { duration: RM ? 1 : 420, easing: 'ease-in' });
    end(g);
  }
  const blocked = () => document.body.classList.contains('menu-open') || !!$('.modal.open, .lb.open, .game.open');

  svg.addEventListener('click', () => {
    mood('shock'); svg.classList.add('snip'); say(pick(POKE), 1600);
    T(() => { svg.classList.remove('snip'); mood('happy'); }, 900);
    if (++pokes === 5) toast('Чубика не поймать. Зато его можно подстричь: он в зеркале наверху.');
  });
  $$('[data-peek]').forEach(b => {
    b.addEventListener('mouseenter', () => peek(b));
    b.addEventListener('mouseleave', () => setTimeout(() => { if (peekBtn === b) unpeek(); }, 220));
  });
  addEventListener('scroll', () => { if (peekBtn) unpeek(); }, { passive: true });

  /* section drops */
  const seen = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || seen.has(e.target) || busy || Date.now() - cool < 9000) return;
    if (Math.random() < .6) { seen.add(e.target); drop(e.target.dataset.drop); }
  }), { threshold: .16 });
  $$('[data-drop]').forEach(s => io.observe(s));

  /* idle hints + rare ambient appearances */
  let lastAct = Date.now(), hints = 0, nextAmb = Date.now() + rand(45000, 70000);
  ['pointermove', 'scroll', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.hidden || blocked() || busy) return;
    const now = Date.now();
    if (now - lastAct > 22000 && hints < HINTS.length) { lastAct = now; edge(HINTS[hints++], 6200); return; }
    if (now > nextAmb && now - cool > 8000) {
      nextAmb = now + rand(50000, 85000); const r = Math.random();
      if (r < .4) runAcross(); else if (r < .7) edge(null, 1800); else edge(pick(FACTS), 4400);
    }
  }, 1000);

  return { intro: () => setTimeout(() => runAcross({ ltr: true, stop: 'Привет! Я Чубик. Живу на этом сайте.' }), 250), reset, hush: () => { if (busy) reset(); } };
})();

/* =========================================================
   Loader → reveal
   ========================================================= */
{
  const t0 = performance.now(), LD = RM ? 250 : 1400, n = $('#ldN'), bar = $('#ldBar');
  let done = false;
  const step = t => {
    const p = Math.min(1, (t - t0) / LD), e = 1 - Math.pow(1 - p, 3);
    n.textContent = Math.round(e * 100); bar.style.transform = `scaleX(${e})`;
    if (p < 1) requestAnimationFrame(step); else finish();
  };
  async function finish() {
    if (done) return; done = true;
    try { await Promise.race([document.fonts.ready, sleep(900)]); } catch (e) {}
    fitAll(); Services.place();
    $('#loader').classList.add('done');
    document.documentElement.classList.add('ready');
    setTimeout(() => { $('#loader')?.remove(); Buddy.intro(); }, 850);
  }
  requestAnimationFrame(step);
  setTimeout(finish, 3000);
}

/* =========================================================
   Hero: drifting hair strands
   ========================================================= */
(() => {
  const cv = $('#hairfield'), ctx = cv.getContext('2d'), hero = $('#hero');
  let W = 0, H = 0, vis = true, raf = 0, hx = -999, hy = -999;
  const N = innerWidth < 760 ? 14 : 30, strands = [];
  function size() { const d = Math.min(2, devicePixelRatio || 1); W = hero.clientWidth; H = hero.clientHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  const mk = y => ({ x: Math.random() * W, y: y ?? Math.random() * H, len: rand(40, 130), a: rand(0, 6.28), va: rand(-.004, .004), vy: rand(.15, .5), vx: rand(-.15, .15), curl: rand(-1, 1), ph: rand(0, 6), pink: Math.random() < .18, w: rand(1, 2.4), ox: 0, oy: 0 });
  size(); for (let i = 0; i < N; i++) strands.push(mk());
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); hx = e.clientX - r.left; hy = e.clientY - r.top; }, { passive: true });
  hero.addEventListener('pointerleave', () => { hx = hy = -999; });
  function frame(t) {
    ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round';
    for (const s of strands) {
      s.y += s.vy; s.x += s.vx; s.a += s.va;
      const dx = s.x - hx, dy = s.y - hy, d = Math.hypot(dx, dy) || 1;
      if (d < 150) { const f = (150 - d) / 150 * 3.5; s.ox += dx / d * f; s.oy += dy / d * f; }
      s.ox *= .93; s.oy *= .93;
      if (s.y - s.len > H) Object.assign(s, mk(-70));
      const x = s.x + s.ox, y = s.y + s.oy, c = Math.cos(s.a), sn = Math.sin(s.a), hl = s.len / 2, wob = Math.sin(t / 900 + s.ph) * 18 * s.curl;
      ctx.beginPath(); ctx.moveTo(x - c * hl, y - sn * hl); ctx.quadraticCurveTo(x - sn * wob, y + c * wob, x + c * hl, y + sn * hl);
      ctx.strokeStyle = s.pink ? 'rgba(255,95,162,.42)' : 'rgba(238,234,246,.12)'; ctx.lineWidth = s.w; ctx.stroke();
    }
    raf = (!RM && vis && !document.hidden) ? requestAnimationFrame(frame) : 0;
  }
  const kick = () => { if (!raf && !RM && vis && !document.hidden) raf = requestAnimationFrame(frame); };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; kick(); }).observe(hero);
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', debounce(size, 200));
  if (RM) frame(0); else kick();
})();

/* hero parallax: lines slide apart on scroll */
if (!RM) {
  const l1 = $('.h1 .ln:first-child'), l3 = $('.h1 .ln3'), m = $('#mirror'); let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY; ticking = false; if (y > innerHeight * 1.3) return;
      l1.style.transform = `translateX(${-y * .12}px)`; l3.style.transform = `translateX(${y * .1}px)`; m.style.transform = `rotate(${y * .03}deg)`;
    });
  }, { passive: true });
}

/* hero: open/closed status */
function openState() {
  const n = msk(), d = n.getDay(), h = n.getHours() + n.getMinutes() / 60, [o, c] = HOURS[d];
  if (h >= o && h < c) return { open: true, txt: `Открыто до ${c}:00` };
  if (h < o) return { open: false, txt: `Закрыто · откроемся в ${o}:00` };
  return { open: false, txt: `Закрыто · завтра с ${HOURS[(d + 1) % 7][0]}:00` };
}
{
  const s = openState();
  $('#heroTagTxt').textContent = (s.open ? 'Сейчас открыто · ' : 'Сейчас закрыто · ') + 'Покровка, 17';
  $('#heroTag').classList.toggle('closed', !s.open);
  $('#statusTxt').textContent = s.txt; $('#status').classList.toggle('closed', !s.open);
  const d = msk().getDay(); $$('#hours [data-d]').forEach(r => r.classList.toggle('today', r.dataset.d.split(',').includes(String(d))));
}

/* =========================================================
   Hero mirror: give Чубик a haircut
   ========================================================= */
(() => {
  const btn = $('#mirrorBtn'), wrap = $('#mirrorBuddy'), cap = $('#mirrorCap'), fx = $('#snipfx'), mirror = $('#mirror');
  const order = [['hedgehog', 'ёжик'], ['mohawk', 'ирокез'], ['bowl', 'горшок'], ['curly', 'кудри'], ['bald', 'лысый. увлеклись'], ['shaggy', 'отросло!']];
  let i = -1, cuts = 0;
  const svg = () => $('svg', wrap);
  btn.addEventListener('mouseenter', () => { if (svg().dataset.mood === 'normal') svg().dataset.mood = 'happy'; });
  btn.addEventListener('mouseleave', () => { if (svg().dataset.mood === 'happy') svg().dataset.mood = 'normal'; });
  btn.addEventListener('click', () => {
    i = (i + 1) % order.length; cuts++;
    const s = svg(), [st, name] = order[i];
    s.dataset.mood = 'shock'; s.classList.add('snip');
    fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    spray();
    setTimeout(() => {
      setHair(s, st, cuts + 3);
      wrap.classList.remove('pop'); void wrap.offsetWidth; wrap.classList.add('pop');
      s.dataset.mood = 'happy';
      cap.textContent = `${name} · стрижек: ${cuts}`;
      cap.classList.remove('bump'); void cap.offsetWidth; cap.classList.add('bump');
    }, 240);
    setTimeout(() => { s.classList.remove('snip'); s.dataset.mood = 'normal'; }, 1500);
    if (cuts === 12) toast('12 стрижек подряд. Чубик официально твой постоянный клиент.');
  });
  function spray() {
    if (RM) return;
    for (let k = 0; k < 16; k++) {
      const el = document.createElement('i'); el.className = 'strand';
      if (Math.random() < .3) el.style.background = 'var(--chalk)';
      mirror.appendChild(el);
      const a = rand(-Math.PI, 0), sp = rand(60, 170), dx = Math.cos(a) * sp, dy = Math.sin(a) * sp * .6, rot = rand(-360, 360);
      el.animate([
        { transform: `translate(-50%,-50%) rotate(${rand(0, 180)}deg)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${rot / 2}deg)`, opacity: 1, offset: .4 },
        { transform: `translate(calc(-50% + ${dx * 1.3}px),calc(-50% + ${dy + 240}px)) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: rand(900, 1400), easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => el.remove();
    }
  }
})();

/* =========================================================
   Nav: hover blob, hide on scroll, current section, mobile menu
   ========================================================= */
(() => {
  const nav = $('#nav'), menu = $('#menu'), blob = $('.blob', menu), links = $$('a', menu);
  links.forEach(a => a.addEventListener('mouseenter', () => { blob.style.left = a.offsetLeft + 'px'; blob.style.width = a.offsetWidth + 'px'; blob.style.opacity = 1; }));
  menu.addEventListener('mouseleave', () => { blob.style.opacity = 0; });
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, down = y > lastY + 2, up = y < lastY - 2;
    if (y > 240 && down && !document.body.classList.contains('menu-open')) nav.classList.add('hide');
    else if (up || y < 240) nav.classList.remove('hide');
    lastY = y;
  }, { passive: true });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle('cur', l.hash === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const s = $(l.hash); if (s) io.observe(s); });

  const burger = $('#burger'), mm = $('#mmenu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    lock(open); nav.classList.remove('hide'); if (open) Buddy.hush();
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a, button', mm).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 980 && document.body.classList.contains('menu-open')) setMenu(false); });
})();

/* magnetic buttons */
if (FINE && !RM) $$('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * 16}px,${((e.clientY - r.top) / r.height - .5) * 14}px)`; });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
});

/* =========================================================
   Services: living cards + Чубик that hops between them
   ========================================================= */
const Services = { place() {} };

/* team: tap to open on touch */
$$('.bar').forEach(b => {
  b.addEventListener('click', e => { if (e.target.closest('.js-book')) return; const was = b.classList.contains('open'); $$('.bar.open').forEach(x => x.classList.remove('open')); if (!was) b.classList.add('open'); });
  b.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === b) b.click(); });
});

/* =========================================================
   Portfolio + before/after lightbox
   ========================================================= */
(() => {
  const lb = $('#lb'), ba = $('#ba');
  let li = 0, p = 50, lastFocus = null, tween = 0;
  $$('.work').forEach(w => {
    w.addEventListener('pointermove', e => { const r = w.getBoundingClientRect(); w.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - .5) * -14}px`); w.style.setProperty('--my', `${((e.clientY - r.top) / r.height - .5) * -14}px`); });
    w.addEventListener('click', () => open(+w.dataset.i));
  });
  const setP = v => { p = clamp(v, 0, 100); ba.style.setProperty('--p', p + '%'); };
  function sweep() {
    cancelAnimationFrame(tween); if (RM) { setP(50); return; }
    const t0 = performance.now();
    const st = t => { const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); setP(88 - 38 * e); if (k < 1) tween = requestAnimationFrame(st); };
    tween = requestAnimationFrame(st);
  }
  function open(i) {
    li = (i + WORKS.length) % WORKS.length; const w = WORKS[li];
    $('#baBefore').innerHTML = portrait({ ...w.base, ...w.before });
    $('#baAfter').innerHTML = portrait({ ...w.base, ...w.after, smile: true });
    $('#lbTitle').textContent = w.t;
    $('#lbEyebrow').textContent = `Работа ${String(li + 1).padStart(2, '0')}`;
    $('#lbDl').innerHTML = `<dt>Мастер</dt><dd>${w.m}</dd><dt>Время</dt><dd>${w.time}</dd><dt>Чем</dt><dd>${w.tools}</dd>`;
    $('#lbCount').textContent = `${li + 1} / ${WORKS.length}`;
    $('#lbBook').dataset.master = w.m;
    if (!lb.classList.contains('open')) { lastFocus = document.activeElement; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lock(true); Buddy.hush(); setTimeout(() => $('#lbX').focus({ preventScroll: true }), 60); }
    sweep();
  }
  function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lock(false); lastFocus?.focus?.({ preventScroll: true }); }
  $('#lbX').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', () => open(li - 1));
  $('#lbNext').addEventListener('click', () => open(li + 1));
  $('#lbBook').addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (document.activeElement === ba && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); cancelAnimationFrame(tween); setP(p + (e.key === 'ArrowLeft' ? -5 : 5)); }
    else if (e.key === 'ArrowLeft') open(li - 1);
    else if (e.key === 'ArrowRight') open(li + 1);
  });
  let dragging = false;
  const fromEv = e => { const r = ba.getBoundingClientRect(); setP((e.clientX - r.left) / r.width * 100); };
  ba.addEventListener('pointerdown', e => { dragging = true; cancelAnimationFrame(tween); ba.setPointerCapture(e.pointerId); fromEv(e); });
  ba.addEventListener('pointermove', e => { if (dragging) fromEv(e); });
  ba.addEventListener('pointerup', () => { dragging = false; });
  ba.addEventListener('pointercancel', () => { dragging = false; });
})();

/* =========================================================
   Why us: switching scenes
   ========================================================= */
(() => {
  const root = $('#why'), items = $$('.why-item', root), scenes = $$('.scene', root), bud = $('#whyBuddy');
  let t = ''; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, L = i % 6 === 0, r2 = L ? 126 : 140; t += `<line x1="${f1(200 + Math.cos(a) * 152)}" y1="${f1(200 + Math.sin(a) * 152)}" x2="${f1(200 + Math.cos(a) * r2)}" y2="${f1(200 + Math.sin(a) * r2)}" stroke="#eeeaf6" stroke-opacity="${L ? .7 : .28}" stroke-width="${L ? 3 : 1.5}"/>`; }
  $('#ticks').innerHTML = t;
  let g = ''; for (let r = 56; r < 148; r += 4) g += `<circle cx="200" cy="200" r="${r}" fill="none" stroke="#eeeaf6" stroke-opacity="${(.03 + Math.random() * .06).toFixed(3)}" stroke-width="1.4"/>`;
  $('#grooves').innerHTML = g;
  const looks = [['hedgehog', 'normal'], ['mohawk', 'happy'], ['curly', 'sleep'], ['shaggy', 'happy']];
  let cur = 0, timer = 0, visible = false;
  function go(i) {
    cur = (i + 4) % 4;
    items.forEach((b, k) => { b.classList.toggle('on', k === cur); b.setAttribute('aria-selected', k === cur); });
    scenes.forEach((s, k) => s.classList.toggle('on', k === cur));
    const pr = $('.prog', items[cur]); pr.style.animation = 'none'; void pr.offsetWidth; pr.style.animation = '';
    const s = $('svg', bud); if (s) { setHair(s, looks[cur][0], cur + 3); s.dataset.mood = looks[cur][1]; }
    bud.classList.remove('hop'); void bud.offsetWidth; bud.classList.add('hop');
    schedule();
  }
  function schedule() { clearTimeout(timer); if (!visible || root.classList.contains('paused') || RM) return; timer = setTimeout(() => go(cur + 1), 6500); }
  items.forEach((b, k) => {
    b.addEventListener('click', () => go(k));
    b.addEventListener('mouseenter', () => { if (FINE && k !== cur) go(k); });
    b.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); items[cur].focus(); } if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); items[cur].focus(); } });
  });
  root.addEventListener('mouseenter', () => { if (!FINE) return; root.classList.add('paused'); clearTimeout(timer); });
  root.addEventListener('mouseleave', () => { root.classList.remove('paused'); go(cur); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) schedule(); else clearTimeout(timer); }, { threshold: .3 }).observe(root);
})();

/* =========================================================
   Reviews: draggable slider with inertia
   ========================================================= */
(() => {
  const vp = $('#rvVp'), tr = $('#rvTrack'), bar = $('#rvBar');
  let x = 0, min = 0, v = 0, drag = false, sx = 0, sx0 = 0, lx = 0, lt = 0, raf = 0, moved = 0;
  const bounds = () => { min = Math.min(0, vp.clientWidth - tr.scrollWidth); };
  function set(nx) {
    x = nx; tr.style.transform = `translate3d(${x}px,0,0)`;
    const vis = clamp(vp.clientWidth / tr.scrollWidth, .05, 1), prog = min ? clamp(x / min, 0, 1) : 0;
    bar.style.width = vis * 100 + '%'; bar.style.transform = `translateX(${prog * (1 / vis - 1) * 100}%)`;
  }
  function inertia() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (x > 0 || x < min) { const target = x > 0 ? 0 : min; set(x + (target - x) * .16); v = 0; if (Math.abs(target - x) > .5) raf = requestAnimationFrame(step); else set(target); return; }
      v *= .94; set(x + v); if (Math.abs(v) > .25 || x > 0 || x < min) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function glide(to) {
    cancelAnimationFrame(raf); const from = x, t0 = performance.now(), d = RM ? 1 : 650;
    const st = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); set(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(st); };
    raf = requestAnimationFrame(st);
  }
  vp.addEventListener('pointerdown', e => { if (e.button) return; drag = true; moved = 0; sx = lx = e.clientX; sx0 = x; lt = performance.now(); v = 0; cancelAnimationFrame(raf); vp.setPointerCapture(e.pointerId); vp.classList.add('drag'); });
  vp.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
    let nx = sx0 + dx; if (nx > 0) nx *= .35; else if (nx < min) nx = min + (nx - min) * .35;
    const now = performance.now(); v = (e.clientX - lx) / Math.max(1, now - lt) * 16; lx = e.clientX; lt = now; set(nx);
  });
  const up = () => { if (!drag) return; drag = false; vp.classList.remove('drag'); inertia(); };
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  vp.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); cancelAnimationFrame(raf); set(clamp(x - e.deltaX, min, 0)); } }, { passive: false });
  const stepW = () => ($('.rv', tr)?.offsetWidth || 400) + 18;
  $('#rvPrev').addEventListener('click', () => glide(clamp(x + stepW(), min, 0)));
  $('#rvNext').addEventListener('click', () => glide(clamp(x - stepW(), min, 0)));
  addEventListener('resize', debounce(() => { bounds(); set(clamp(x, min, 0)); }, 150));
  bounds(); set(0);
  setTimeout(() => { bounds(); set(clamp(x, min, 0)); }, 1500);
})();

/* =========================================================
   Stylised map with pan / zoom
   ========================================================= */
(() => {
  const m = $('#map'), g = $('#mapg'), tip = $('#mapTip');
  let s = '<rect x="-1400" y="-1400" width="3800" height="3500" fill="#17141f"/><g transform="rotate(-9 500 360)">';
  for (let x = -700; x < 1700; x += 108) for (let y = -600; y < 1300; y += 88) s += `<rect x="${x}" y="${y}" width="${88 + ((x * 7 + y * 3) & 3) * 3}" height="72" rx="10" fill="#1f1b29"/>`;
  s += '</g>';
  s += '<path id="blvd" d="M790 -400 C 730 100, 700 300, 730 470 S 800 820, 830 1200" fill="none" stroke="#1d2622" stroke-width="80"/>';
  const streets = [
    { d: 'M-400 720 C -80 660, 180 590, 380 500 S 720 360, 1400 230', w: 32, n: 'УЛ. ПОКРОВКА', off: '44%' },
    { d: 'M-400 170 C 100 150, 500 120, 1400 30', w: 26, n: 'МЯСНИЦКАЯ УЛ.', off: '34%' },
    { d: 'M300 -400 C 330 100, 360 400, 420 1200', w: 15, n: 'АРМЯНСКИЙ ПЕР.', off: '22%' },
    { d: 'M520 -400 C 540 100, 560 300, 600 1200', w: 15, n: 'ПОТАПОВСКИЙ ПЕР.', off: '63%' },
    { d: 'M-400 420 C 0 400, 200 330, 330 300', w: 12 },
    { d: 'M620 600 C 700 620, 900 640, 1400 700', w: 12 },
    { d: 'M80 -400 C 110 200, 140 500, 120 1200', w: 18, n: 'ЛУБЯНСКИЙ ПР.', off: '58%' }
  ];
  streets.forEach((st, i) => { s += `<path id="st${i}" d="${st.d}" fill="none" stroke="#2b2638" stroke-width="${st.w}" stroke-linecap="round"/>`; });
  streets.forEach((st, i) => { if (st.n) s += `<text font-size="11" letter-spacing="3" fill="#7a7390" dy="4"><textPath href="#st${i}" startOffset="${st.off}">${st.n}</textPath></text>`; });
  s += '<g id="trees"></g>';
  s += '<g class="hot" data-tip="Чистые пруды. Летом утки, зимой каток"><ellipse cx="748" cy="150" rx="30" ry="84" transform="rotate(-6 748 150)" fill="#2a2544"/><ellipse cx="748" cy="150" rx="18" ry="60" transform="rotate(-6 748 150)" fill="none" stroke="#eeeaf6" stroke-opacity=".12"/></g>';
  s += '<text x="786" y="40" font-size="11" letter-spacing="3" fill="#7a7390">ЧИСТОПРУДНЫЙ Б-Р</text>';
  const metro = (x, y, name, t, lx, ly) => `<g class="hot" data-tip="${t}"><circle cx="${x}" cy="${y}" r="22" fill="#eeeaf6"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="19" fill="#121019" style="font-family:'Dela Gothic One',sans-serif">М</text></g><text x="${lx}" y="${ly}" font-size="12" font-weight="600" letter-spacing="2" fill="#eeeaf6">${name}</text>`;
  s += metro(40, 650, 'КИТАЙ-ГОРОД', 'М Китай-город, выход 9 на Покровку. 7 минут пешком', 72, 655);
  s += metro(690, 96, 'ЧИСТЫЕ ПРУДЫ', 'М Чистые пруды. 9 минут пешком через переулки', 612, 60);
  s += '<path class="route" d="M58 636 C 170 600, 290 548, 380 500 S 500 436, 560 426" fill="none" stroke="#ff5fa2" stroke-width="5" stroke-linecap="round"/>';
  s += '<g transform="translate(262 560)"><rect x="-38" y="-15" width="76" height="30" rx="15" fill="#ff5fa2"/><text y="5" text-anchor="middle" font-size="12" font-weight="600" fill="#121019" letter-spacing="1">7 МИН</text></g>';
  s += '<g class="hot" data-tip="Обжарщик, у которого мы берём зёрна для эспрессо"><circle cx="330" cy="420" r="17" fill="#342d45" stroke="#eeeaf6" stroke-width="2"/><path d="M322 414 h14 v6 a7 7 0 0 1 -14 0 z M336 416 h3 a3 3 0 0 1 0 6 h-3" fill="none" stroke="#eeeaf6" stroke-width="2"/></g>';
  s += '<g class="hot" data-tip="Парковка во дворе: 2 места для клиентов"><rect x="620" y="466" width="30" height="30" rx="8" fill="#342d45" stroke="#eeeaf6" stroke-width="2"/><text x="635" y="487" text-anchor="middle" font-size="16" font-weight="600" fill="#eeeaf6">P</text></g>';
  s += '<g class="hot" data-tip="NAME. Покровка, 17, стр. 1. Вход со двора, розовая дверь"><circle class="pulse" cx="560" cy="426" r="18" fill="#ff5fa2"/><path d="M560 426 C 534 396, 526 380, 526 366 A 34 34 0 1 1 594 366 C 594 380, 586 396, 560 426 Z" fill="#ff5fa2" stroke="#121019" stroke-width="3"/><circle cx="560" cy="364" r="13" fill="#121019"/></g>';
  s += '<g transform="translate(604 346)"><rect width="104" height="36" rx="18" fill="#eeeaf6"/><text x="52" y="24" text-anchor="middle" font-size="14" fill="#121019" style="font-family:\'Dela Gothic One\',sans-serif">NAME</text></g>';
  s += chubik({ style: 'shaggy', seed: 4, attrs: ' x="526" y="262" width="68" height="68"' }).replace('class="chubik"', 'class="chubik map-buddy"');
  g.innerHTML = s;
  /* trees along the boulevard */
  const bl = $('#blvd'), L = bl.getTotalLength(); let tr = '';
  for (let d = 0; d < L; d += 34) { const p = bl.getPointAtLength(d); tr += `<circle cx="${f1(p.x - 22)}" cy="${f1(p.y)}" r="8" fill="#26332d"/><circle cx="${f1(p.x + 22)}" cy="${f1(p.y + 14)}" r="7" fill="#26332d"/>`; }
  $('#trees').innerHTML = tr;

  const PIN = [560, 380]; const st = { s: 1, x: 0, y: 0 };
  const apply = () => { g.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.s})`; };
  const home = () => { st.s = innerWidth < 760 ? 1.05 : 1.2; st.x = 500 - PIN[0] * st.s; st.y = 380 - PIN[1] * st.s; apply(); };
  const k = () => { const r = m.getBoundingClientRect(); return Math.max(r.width / 1000, r.height / 720); };
  const zoom = f => { const ns = clamp(st.s * f, .7, 3); st.x = 500 - (500 - st.x) * (ns / st.s); st.y = 360 - (360 - st.y) * (ns / st.s); st.s = ns; apply(); };
  $('#zIn').addEventListener('click', () => zoom(1.35)); $('#zOut').addEventListener('click', () => zoom(1 / 1.35)); $('#zHome').addEventListener('click', home);
  m.addEventListener('dblclick', e => { if (!e.target.closest('.map-ctrl')) zoom(1.5); });
  let d = null;
  m.addEventListener('pointerdown', e => { if (e.target.closest('.map-ctrl') || e.button) return; d = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, id: e.pointerId, moved: false }; });
  m.addEventListener('pointermove', e => {
    if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) > 4) { d.moved = true; m.setPointerCapture(d.id); m.classList.add('drag'); tip.classList.remove('show'); }
    if (d.moved) { const kk = k(); st.x = clamp(d.sx + dx / kk, -1100 * st.s, 700); st.y = clamp(d.sy + dy / kk, -900 * st.s, 600); apply(); }
  });
  const up = () => { d = null; m.classList.remove('drag'); };
  m.addEventListener('pointerup', up); m.addEventListener('pointercancel', up);
  const showTip = el => { const r = el.getBoundingClientRect(), mr = m.getBoundingClientRect(); tip.textContent = el.dataset.tip; tip.style.left = clamp(r.left + r.width / 2 - mr.left, 120, mr.width - 120) + 'px'; tip.style.top = (r.top - mr.top) + 'px'; tip.classList.add('show'); };
  $$('.hot', g).forEach(h => {
    h.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !d) showTip(h); });
    h.addEventListener('pointerleave', () => tip.classList.remove('show'));
    h.addEventListener('click', () => { showTip(h); clearTimeout(h._t); h._t = setTimeout(() => tip.classList.remove('show'), 2600); });
  });
  home();
})();

/* =========================================================
   Booking modal
   ========================================================= */
const SLOT_STEP = 45;
function slotsFor(date, master) {
  const [o, c] = HOURS[date.getDay()], out = [], now = msk();
  const today = date.toDateString() === now.toDateString(), nowMin = now.getHours() * 60 + now.getMinutes();
  for (let t = o * 60; t <= c * 60 - 60; t += SLOT_STEP) {
    const hh = String(Math.floor(t / 60)).padStart(2, '0'), mm = String(t % 60).padStart(2, '0'), label = `${hh}:${mm}`;
    const busy = hash(date.toDateString() + label + master) % 100 < (master === 'Любой' ? 22 : 42);
    out.push({ label, off: busy || (today && t < nowMin + 30) });
  }
  return out;
}
const DAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'], DAYS_FULL = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

/* final CTA line with real free slots */
{
  const now = msk(); let day = new Date(now), free = slotsFor(day, 'Любой').filter(x => !x.off), when = 'сегодня';
  if (free.length < 2) { day.setDate(day.getDate() + 1); free = slotsFor(day, 'Любой').filter(x => !x.off); when = 'завтра'; }
  const late = free.filter(x => x.label >= '17:00'), pickd = (late.length >= 2 ? late : free).slice(0, 2);
  if (pickd.length === 2) $('#finalSlots').textContent = `Кресло свободно ${when} в ${pickd[0].label}. И в ${pickd[1].label}. Ну ты понял.`;
}

const Booking = (() => {
  const modal = $('#modal'), form = $('#bk'), view = $('#bkFormView'), doneV = $('#bkDone');
  const elSvc = $('#bkSvc'), elM = $('#bkMaster'), elD = $('#bkDay'), elT = $('#bkTime'), sum = $('#bkSum'), btn = $('#bkSubmit');
  const name = $('#bkName'), phone = $('#bkPhone');
  let days = [], lastFocus = null;
  elSvc.innerHTML = SVC.map(([n, p, t], i) => `<label class="chip"><input type="radio" name="svc" value="${n}"${i ? '' : ' checked'}><span>${n}<small>${p.toLocaleString('ru-RU')} ₽ · ${t} мин</small></span></label>`).join('');
  elM.innerHTML = MASTERS.map((n, i) => `<label class="chip"><input type="radio" name="master" value="${n}"${i ? '' : ' checked'}><span>${n}</span></label>`).join('');
  function buildDays() {
    const n = msk(); days = [];
    for (let i = 0; i < 7; i++) { const d = new Date(n); d.setDate(n.getDate() + i); days.push(d); }
    elD.innerHTML = days.map((d, i) => `<label class="chip"><input type="radio" name="day" value="${i}"${i ? '' : ' checked'}><span>${i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : DAYS[d.getDay()][0].toUpperCase() + DAYS[d.getDay()].slice(1)}<small>${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}</small></span></label>`).join('');
  }
  const val = n => form.elements[n]?.value;
  function buildTimes() {
    const di = +val('day'), list = slotsFor(days[di], val('master'));
    if (di === 0 && list.every(x => x.off)) { form.elements.day[1].checked = true; return buildTimes(); }
    let first = true;
    elT.innerHTML = list.map(s => { const c = !s.off && first; if (c) first = false; return `<label class="chip"><input type="radio" name="time" value="${s.label}"${s.off ? ' disabled' : ''}${c ? ' checked' : ''}><span>${s.label}</span></label>`; }).join('');
    summary();
  }
  function summary() {
    const s = SVC.find(x => x[0] === val('svc')), d = days[+val('day')], m = val('master');
    sum.textContent = `${s[0]} · ${m === 'Любой' ? 'любой мастер' : m} · ${d.getDate()} ${MONTHS[d.getMonth()]}${val('time') ? ', ' + val('time') : ''} · ${s[1].toLocaleString('ru-RU')} ₽`;
  }
  form.addEventListener('change', e => { if (e.target.name === 'day' || e.target.name === 'master') buildTimes(); else summary(); });
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, ''); if (!d) { phone.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1); if (d[0] !== '7') d = '7' + d; d = d.slice(0, 11);
    let o = '+7'; if (d.length > 1) o += ' (' + d.slice(1, 4); if (d.length >= 4) o += ')'; if (d.length > 4) o += ' ' + d.slice(4, 7); if (d.length > 7) o += '-' + d.slice(7, 9); if (d.length > 9) o += '-' + d.slice(9, 11);
    phone.value = o;
  });
  const err = (f, msg) => { f.classList.toggle('err', !!msg); $('.msg', f).textContent = msg || ''; };
  [name, phone].forEach(i => i.addEventListener('input', () => err(i.closest('.field'), '')));

  /* Hook for a real backend / CRM. Replace the body with a fetch() to your API. */
  async function sendBooking(data) { await sleep(1300); return { ok: true, data }; }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let ok = true;
    if (name.value.trim().length < 2) { err($('#fName'), 'Напиши имя, чтобы мастер знал, как к тебе обращаться'); ok = false; }
    if (phone.value.replace(/\D/g, '').length !== 11) { err($('#fPhone'), 'Нужен номер из 10 цифр после +7'); ok = false; }
    if (!val('time')) { toast('На этот день всё занято. Выбери другой день или мастера.'); ok = false; }
    if (!ok) { $('.field.err input', form)?.focus(); return; }
    btn.classList.add('loading'); btn.disabled = true;
    const d = days[+val('day')];
    const data = { service: val('svc'), master: val('master'), date: d.toISOString().slice(0, 10), time: val('time'), name: name.value.trim(), phone: phone.value };
    try {
      await sendBooking(data);
      $('#bkDoneTxt').textContent = `${data.name}, ждём тебя в ${DAYS_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}, в ${data.time} на Покровке, 17. ${data.master === 'Любой' ? 'Мастера подберём сами.' : 'Мастер: ' + data.master + '.'} Позвоним на ${data.phone}, чтобы подтвердить.`;
      view.hidden = true; doneV.hidden = false; $('#bkOk').focus();
    } catch (x) { toast('Не получилось отправить заявку. Проверь интернет и попробуй ещё раз.'); }
    finally { btn.classList.remove('loading'); btn.disabled = false; }
  });
  function open(opt = {}) {
    Buddy.hush(); $('#game').classList.contains('open') && Game.close();
    view.hidden = false; doneV.hidden = true; buildDays();
    if (opt.service) { const r = [...form.elements.svc].find(x => x.value === opt.service); if (r) r.checked = true; }
    const mm = [...form.elements.master].find(x => x.value === (opt.master || 'Любой')); if (mm) mm.checked = true;
    buildTimes();
    lastFocus = document.activeElement;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); lock(true);
    setTimeout(() => (form.querySelector('input:checked') || name).focus({ preventScroll: true }), 80);
  }
  function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); lock(false); lastFocus?.focus?.({ preventScroll: true }); }
  $('#bkX').addEventListener('click', close); $('#bkOk').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { const f = $$('button, input:not([disabled]), [tabindex="0"]', modal).filter(x => x.offsetParent); const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  return { open, close };
})();

/* =========================================================
   Mini-game «Помоги Чубику»
   ========================================================= */
const Game = (() => {
  const box = $('#game'), cv = $('#gcv'), ctx = cv.getContext('2d'), W = 360, H = 440, DUR = 25;
  const dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const elS = $('#gScore'), elT = $('#gTime'), elC = $('#gCombo'), start = $('#gStart'), over = $('#gOver');
  const TYPES = [{ k: 'hair', pts: 10, w: 58 }, { k: 'comb', pts: 25, w: 22 }, { k: 'gold', pts: 100, w: 5 }, { k: 'gum', pts: -60, w: 14 }];
  const TOT = TYPES.reduce((a, t) => a + t.w, 0);
  const fluff = []; { const r = rng(21); for (let i = 0; i < 26; i++) fluff.push(i % 2 ? 1.12 + r() * .18 : .9); }
  let st = 'idle', items = [], pops = [], score = 0, combo = 0, mult = 1, time = DUR, last = 0, acc = 0, raf = 0, lastFocus = null;
  const P = { x: W / 2, tx: W / 2, stun: 0, sq: 0, face: 'normal', ft: 0 };
  const pickType = () => { let r = Math.random() * TOT; for (const t of TYPES) if ((r -= t.w) < 0) return t; return TYPES[0]; };
  const hud = () => { elS.textContent = score; elT.textContent = Math.ceil(time); elC.textContent = '×' + mult; };
  function open() {
    Buddy.hush(); lastFocus = document.activeElement;
    box.classList.add('open'); box.setAttribute('aria-hidden', 'false');
    if (st !== 'play') { start.hidden = false; over.hidden = true; items = []; pops = []; draw(); setTimeout(() => $('#gGo').focus({ preventScroll: true }), 80); }
  }
  function close() { box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); if (st === 'play') { st = 'idle'; cancelAnimationFrame(raf); } lastFocus?.focus?.({ preventScroll: true }); }
  function begin() { st = 'play'; items = []; pops = []; score = 0; combo = 0; mult = 1; time = DUR; acc = 0; P.x = P.tx = W / 2; P.stun = 0; P.face = 'normal'; start.hidden = true; over.hidden = true; hud(); last = performance.now(); raf = requestAnimationFrame(loop); cv.focus?.(); }
  function loop(t) { const dt = Math.min(.05, (t - last) / 1000); last = t; update(dt); draw(); if (st === 'play') raf = requestAnimationFrame(loop); }
  function update(dt) {
    time -= dt; if (time <= 0) { time = 0; hud(); finish(); return; }
    const prog = 1 - time / DUR; acc += dt * (1.3 + prog * 2.7);
    while (acc > 1) { acc -= 1; const t = pickType(); items.push({ t, x: rand(26, W - 26), y: -26, vy: rand(110, 150) * (1 + prog * .95), sway: rand(10, 40), ph: rand(0, 6), r: rand(0, 6), vr: rand(-3, 3) }); }
    if (P.stun > 0) P.stun -= dt; else P.x += (P.tx - P.x) * Math.min(1, dt * 16);
    P.sq *= .86;
    for (const it of items) {
      it.y += it.vy * dt; it.x += Math.sin(it.y / 40 + it.ph) * it.sway * dt; it.r += it.vr * dt;
      if (!it.done && it.y > H - 104 && it.y < H - 44 && Math.abs(it.x - P.x) < 44) { it.done = true; grab(it); }
      if (!it.done && it.y > H + 26) { it.done = true; if (it.t.pts > 0) { combo = 0; mult = 1; } }
    }
    items = items.filter(i => !i.done);
    for (const q of pops) { q.y -= 44 * dt; q.a -= dt * 1.3; }
    pops = pops.filter(q => q.a > 0);
    hud();
  }
  function grab(it) {
    clearTimeout(P.ft);
    if (it.t.pts < 0) {
      score = Math.max(0, score + it.t.pts); combo = 0; mult = 1; P.stun = .6; P.face = 'shock';
      pops.push({ x: it.x, y: it.y - 10, txt: String(it.t.pts), c: '#7de2d1', a: 1 });
      try { navigator.vibrate?.(50); } catch (e) {}
      P.ft = setTimeout(() => P.face = 'normal', 700);
    } else {
      combo++; mult = Math.min(5, 1 + Math.floor(combo / 5)); const g = it.t.pts * mult; score += g; P.face = 'happy'; P.sq = 1;
      pops.push({ x: it.x, y: it.y - 10, txt: '+' + g, c: it.t.k === 'gold' ? '#ffd166' : '#ff5fa2', a: 1 });
      P.ft = setTimeout(() => P.face = 'normal', 380);
    }
  }
  const PHR = [
    [300, ['Разминка засчитана. Волосы тоже иногда убегают.', 'Я поймал бы больше, но у меня лапки.']],
    [800, ['Неплохо! Ножницы тебе доверить можно.', 'Марат одобрительно кивнул. Кажется.']],
    [1500, ['Уровень: барбер-стажёр. Можно подметать зал.', 'Столько волос я не видел со времён маллетов.']],
    [Infinity, ['Легенда! Скажи на ресепшене «Чубик ловит» и получи эспрессо с собой.', 'Ты ловишь быстрее, чем Лев стрижёт. А он быстрый.']]
  ];
  function finish() {
    st = 'over'; cancelAnimationFrame(raf); draw();
    let best = 0; try { best = +localStorage.getItem('chub-best') || 0; if (score > best) localStorage.setItem('chub-best', score); } catch (e) {}
    $('#gFinal').textContent = score.toLocaleString('ru-RU');
    $('#gPhrase').textContent = pick(PHR.find(([lim]) => score < lim)[1]);
    $('#gBest').textContent = score > best && score > 0 ? 'Новый рекорд!' : best ? `Твой рекорд: ${best.toLocaleString('ru-RU')}` : '';
    const s = $('#gOverBuddy svg'); if (s) s.dataset.mood = score >= 500 ? 'happy' : 'shock';
    over.hidden = false; $('#gAgain').focus({ preventScroll: true });
  }
  /* drawing */
  function strand(c) { ctx.beginPath(); ctx.moveTo(-13, -4); ctx.bezierCurveTo(-5, -14, 3, 6, 13, -5); ctx.strokeStyle = c; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.stroke(); }
  function drawItem(it) {
    ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.r);
    const k = it.t.k;
    if (k === 'hair') { strand('#eeeaf6'); ctx.translate(3, 6); strand('#ff5fa2'); }
    else if (k === 'comb') { ctx.fillStyle = '#eeeaf6'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-17, -7, 34, 7, 3) : ctx.rect(-17, -7, 34, 7); ctx.fill(); for (let i = 0; i < 8; i++) ctx.fillRect(-16 + i * 4.4, 0, 2.2, 9); }
    else if (k === 'gold') { ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 14; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-9, 9, 5.5, 0, 7); ctx.moveTo(14.5, 9); ctx.arc(9, 9, 5.5, 0, 7); ctx.moveTo(-5, 5); ctx.lineTo(12, -14); ctx.moveTo(5, 5); ctx.lineTo(-12, -14); ctx.stroke(); }
    else { ctx.fillStyle = '#7de2d1'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-4, -5, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#121019'; ctx.font = '700 14px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('!', 0, 6); }
    ctx.restore();
  }
  function drawPlayer() {
    const y = H - 70, x = P.x + (P.stun > 0 ? Math.sin(performance.now() / 30) * 3 : 0);
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + .14 * P.sq, 1 - .12 * P.sq);
    ctx.strokeStyle = '#eeeaf6'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const legT = st === 'play' ? Math.sin(performance.now() / 70) * 4 * Math.min(1, Math.abs(P.tx - P.x) / 20) : 0;
    ctx.beginPath(); ctx.moveTo(-10, 22); ctx.lineTo(-11 + legT, 38); ctx.moveTo(10, 22); ctx.lineTo(11 - legT, 38); ctx.stroke();
    const N = fluff.length, pts = fluff.map((k, i) => { const a = i / N * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * 30 * k, Math.sin(a) * 30 * k]; });
    ctx.fillStyle = '#ff5fa2'; ctx.beginPath();
    let m0 = [(pts[N - 1][0] + pts[0][0]) / 2, (pts[N - 1][1] + pts[0][1]) / 2]; ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < N; i++) { const p = pts[i], q = pts[(i + 1) % N]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    ctx.fill();
    let tgt = null, bd = 1e9; for (const it of items) { if (it.y < H - 60 && it.t.pts > 0) { const d = Math.abs(it.x - x) + (H - it.y) * .3; if (d < bd) { bd = d; tgt = it; } } }
    const lx = tgt ? clamp((tgt.x - x) / 60, -1, 1) * 2.6 : 0, ly = tgt ? -1.6 : 0;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#121019'; ctx.lineWidth = 1.6;
    if (P.face === 'happy') { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, 1); ctx.quadraticCurveTo(-9, -7, -3, 1); ctx.moveTo(3, 1); ctx.quadraticCurveTo(9, -7, 15, 1); ctx.stroke(); }
    else {
      const r = P.face === 'shock' ? 7.5 : 6.5;
      for (const ex of [-9, 9]) { ctx.beginPath(); ctx.ellipse(ex, 0, r, r * 1.12, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#121019'; ctx.beginPath(); ctx.arc(ex + (P.face === 'shock' ? 0 : lx), 1 + (P.face === 'shock' ? 0 : ly), P.face === 'shock' ? 1.8 : 3.2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; }
    }
    ctx.fillStyle = '#121019';
    if (P.face === 'shock') { ctx.beginPath(); ctx.ellipse(0, 14, 3, 3.8, 0, 0, 7); ctx.fill(); }
    else { ctx.strokeStyle = '#121019'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-5, 12); ctx.quadraticCurveTo(0, 17, 5, 12); ctx.stroke(); }
    ctx.restore();
    if (mult > 1 && st === 'play') { ctx.fillStyle = '#ffd166'; ctx.font = '600 13px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText('×' + mult, x, y - 44); }
  }
  function draw() {
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#221d2e'); gr.addColorStop(1, '#121019'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(238,234,246,.05)'; for (let i = 0; i < 9; i++) ctx.fillRect(i * 44 + 8, 0, 1, H - 30);
    for (let i = 0; i < 18; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#2a2438' : '#191622'; ctx.fillRect(i * 20, H - 30 + j * 15, 20, 15); }
    items.forEach(drawItem); drawPlayer();
    ctx.textAlign = 'center'; ctx.font = '700 17px JetBrains Mono, monospace';
    for (const q of pops) { ctx.globalAlpha = Math.max(0, q.a); ctx.fillStyle = q.c; ctx.fillText(q.txt, q.x, q.y); }
    ctx.globalAlpha = 1;
  }
  const toX = e => { const r = cv.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width * W, 30, W - 30); };
  cv.addEventListener('pointermove', e => { P.tx = toX(e); });
  cv.addEventListener('pointerdown', e => { P.tx = toX(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
  addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (st !== 'play') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); P.tx = clamp(P.tx - 46, 30, W - 30); }
    if (e.key === 'ArrowRight') { e.preventDefault(); P.tx = clamp(P.tx + 46, 30, W - 30); }
  });
  $('#gGo').addEventListener('click', begin); $('#gAgain').addEventListener('click', begin); $('#gClose').addEventListener('click', close);
  draw();
  return { open, close };
})();

/* =========================================================
   Global delegation: booking / game / copy
   ========================================================= */
document.addEventListener('click', e => {
  const ch = e.target.closest('.js-to-chair');
  if (ch) {
    e.preventDefault();
    const fin = $('#final'), btn = $('#roundBtn');
    const far = Math.abs(fin.getBoundingClientRect().top) > 80;
    fin.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    new Promise(r => { if (!far) return r(); const t = setTimeout(r, 1600); addEventListener('scrollend', () => { clearTimeout(t); setTimeout(r, 150); }, { once: true }); }).then(() => {
      btn.dispatchEvent(new Event('mouseenter')); btn.classList.add('pressed');
      setTimeout(() => { btn.classList.remove('pressed'); btn.dispatchEvent(new Event('mouseleave')); btn.click(); }, 420);
    });
    return;
  }
  const b = e.target.closest('.js-book');
  if (b) { e.preventDefault(); Booking.open({ service: b.dataset.service, master: b.dataset.master }); return; }
  const g = e.target.closest('.js-game');
  if (g) { e.preventDefault(); Game.open(); return; }
  const c = e.target.closest('.js-copy');
  if (c) {
    const txt = c.dataset.copy;
    const done = () => toast('Адрес скопирован: ' + txt);
    try { navigator.clipboard.writeText(txt).then(done, () => toast(txt)); } catch (x) { toast(txt); }
  }
});

/* game launcher appears after the hero */
new IntersectionObserver(([e]) => $('#gameFab').classList.toggle('show', !e.isIntersecting), { threshold: .05 }).observe($('#hero'));

/* final CTA: Чубик reacts to the button */
{
  const r = $('#roundBtn'), fb = $('#finalBuddy'), s = () => $('svg', fb);
  const on = () => { s().dataset.mood = 'happy'; fb.classList.add('jump'); s().classList.add('snip'); };
  const off = () => { s().dataset.mood = 'normal'; fb.classList.remove('jump'); s().classList.remove('snip'); };
  r.addEventListener('mouseenter', on); r.addEventListener('focus', on); r.addEventListener('mouseleave', off); r.addEventListener('blur', off);
  fb.addEventListener('click', () => { s().dataset.mood = 'shock'; setTimeout(() => s().dataset.mood = 'normal', 700); });
}

/* footer: wake the sleeper five times */
{
  const sl = $('#sleeper'), s = () => $('svg', sl);
  const lines = ['Ммм… ещё пять минут.', 'А? Я не сплю. Я жду клиента.', 'Ну ладно, ладно, проснулся.', 'Раз ты такой настойчивый…'];
  let taps = 0, tt;
  sl.addEventListener('click', () => {
    taps++; clearTimeout(tt); sl.classList.add('awake');
    if (taps < 5) { s().dataset.mood = taps % 2 ? 'shock' : 'normal'; toast(lines[taps - 1]); }
    else { s().dataset.mood = 'happy'; toast('Секрет: скажи «NAME-10» на ресепшене и получи −10% на первую стрижку.', 6000); taps = 0; }
    tt = setTimeout(() => { s().dataset.mood = 'sleep'; sl.classList.remove('awake'); }, 4000);
  });
}


/* =========================================================
   PC version extras
   ========================================================= */
const PC = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* hero: nearest free slot */
{
  const now = msk(); let day = new Date(now), free = slotsFor(day, 'Любой').filter(x => !x.off), when = 'сегодня';
  if (!free.length) { day.setDate(day.getDate() + 1); free = slotsFor(day, 'Любой').filter(x => !x.off); when = 'завтра'; }
  if (free.length) { const li = document.createElement('li'); li.className = 'meta-hot'; li.textContent = `Ближайшее окно: ${when} ${free[0].label}`; $('.meta').prepend(li); }
}

/* price rows: click opens booking for that service */
$$('#price .pr').forEach(r => r.addEventListener('click', () => Booking.open({ service: ['Короткая стрижка', 'Длинные волосы', 'Классика ножницами', 'Борода', 'Комплекс', 'Детская'][+r.dataset.i] })));


/* works: inline before/after gallery with 5 examples */
(() => {
  const root = $('#gal'); if (!root) return;
  const LIST = [0, 1, 2, 3, 5].map(i => WORKS[i]);
  const ba = $('#galBa'), bef = $('#galBefore'), aft = $('#galAfter'), thumbs = $('#galThumbs');
  let cur = 0, p = 50, tween = 0, drag = false, visible = false;
  thumbs.innerHTML = LIST.map((w, i) => `<button role="tab" aria-label="${w.t}" data-i="${i}">${portrait({ ...w.base, ...w.after, smile: true, vb: '40 60 220 293' })}</button>`).join('');
  const setP = v => { p = clamp(v, 0, 100); ba.style.setProperty('--p', p + '%'); };
  function sweep() {
    cancelAnimationFrame(tween); if (RM) { setP(50); return; }
    const t0 = performance.now();
    const st = t => { const k = Math.min(1, (t - t0) / 1000), e = 1 - Math.pow(1 - k, 3); setP(86 - 36 * e); if (k < 1) tween = requestAnimationFrame(st); };
    tween = requestAnimationFrame(st);
  }
  function render() {
    const w = LIST[cur];
    bef.innerHTML = portrait({ ...w.base, ...w.before });
    aft.innerHTML = portrait({ ...w.base, ...w.after, smile: true });
    $('#galTitle').textContent = w.t;
    $('#galNum').textContent = `Работа ${String(cur + 1).padStart(2, '0')} / ${String(LIST.length).padStart(2, '0')}`;
    $('#galDl').innerHTML = `<dt>Мастер</dt><dd>${w.m}</dd><dt>Время</dt><dd>${w.time}</dd><dt>Чем</dt><dd>${w.tools}</dd>`;
    $('#galBook').dataset.master = w.m;
    $('#galProg').style.width = ((cur + 1) / LIST.length * 100) + '%';
    $$('button', thumbs).forEach((b, i) => { b.classList.toggle('on', i === cur); b.setAttribute('aria-selected', i === cur); });
  }
  function go(i) {
    const n = (i + LIST.length) % LIST.length; if (n === cur && bef.innerHTML) return;
    cur = n;
    if (RM || !bef.innerHTML) { render(); sweep(); return; }
    ba.classList.add('swap');
    setTimeout(() => { render(); ba.classList.remove('swap'); sweep(); }, 280);
  }
  $('#galPrev').addEventListener('click', () => go(cur - 1));
  $('#galNext').addEventListener('click', () => go(cur + 1));
  thumbs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(+b.dataset.i); });
  const fromEv = e => { const r = ba.getBoundingClientRect(); setP((e.clientX - r.left) / r.width * 100); };
  ba.addEventListener('pointerdown', e => { drag = true; cancelAnimationFrame(tween); ba.setPointerCapture(e.pointerId); fromEv(e); });
  ba.addEventListener('pointermove', e => { if (drag) fromEv(e); });
  ba.addEventListener('pointerup', () => { drag = false; });
  ba.addEventListener('pointercancel', () => { drag = false; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: .4 }).observe(root);
  addEventListener('keydown', e => {
    if (!visible || $('.modal.open, .lb.open, .game.open') || e.target.closest('input, textarea')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (document.activeElement === ba) { cancelAnimationFrame(tween); setP(p + (e.key === 'ArrowLeft' ? -5 : 5)); }
    else go(cur + (e.key === 'ArrowLeft' ? -1 : 1));
  });
  cur = 0; render(); setP(50);
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { sweep(); o.disconnect(); } }, { threshold: .5 }).observe(ba);
})();

/* side rail with Чубик riding it */
(() => {
  const rail = $('#rail'); if (!rail) return;
  const SECS = [['hero', 'Старт'], ['uslugi', 'Услуги'], ['mastera', 'Мастера'], ['raboty', 'Работы'], ['pochemu', 'Почему мы'], ['otzyvy', 'Отзывы'], ['kontakty', 'Контакты'], ['final', 'Запись']];
  rail.insertAdjacentHTML('beforeend', SECS.map(([id, t]) => `<a href="#${id}" data-id="${id}"><span>${t}</span><i></i></a>`).join(''));
  mountChubiks(rail);
  const links = $$('a', rail), bud = $('#railBuddy'), fill = $('#railFill');
  let cur = -1;
  const setOn = i => {
    if (i === cur) return; cur = i;
    links.forEach((a, k) => a.classList.toggle('on', k === i));
    const a = links[i], top = a.offsetTop + a.offsetHeight / 2;
    bud.style.transform = `translateY(${top - 34}px)`;
    bud.classList.remove('wig'); void bud.offsetWidth; bud.classList.add('wig');
    const s = $('svg', bud); if (s) { s.dataset.mood = 'happy'; setTimeout(() => s.dataset.mood = 'normal', 700); }
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setOn(SECS.findIndex(s => s[0] === e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  SECS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
  addEventListener('scroll', () => { const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); fill.style.height = (p * 100).toFixed(1) + '%'; }, { passive: true });
  setOn(0);
})();

/* keyboard shortcuts: З — запись (KeyP), И — игра (KeyB) */
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  if ($('.modal.open, .lb.open') || document.body.classList.contains('menu-open')) return;
  if (e.code === 'KeyP') { e.preventDefault(); Booking.open(); }
  else if (e.code === 'KeyB' && !$('#game').classList.contains('open')) { e.preventDefault(); Game.open(); }
});
let kbdSeen = 0;
addEventListener('keydown', e => { if (e.code === 'KeyP' || e.code === 'KeyB') { if (++kbdSeen >= 3) $('#kbdHint')?.classList.add('off'); } });

/* team cards: 3D tilt toward the cursor */
if (PC && !RM) $$('.bar').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; b.style.transition = 'transform .15s ease-out'; b.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 8}deg)`; });
  b.addEventListener('pointerleave', () => { b.style.transition = ''; b.style.transform = ''; });
});

console.log('%cNAME', 'font:48px "Dela Gothic One",sans-serif;color:#ff5fa2', '\nИщешь баги? Лучше найди время на стрижку. Промокод для разработчиков: NAME-DEV.');
})();
