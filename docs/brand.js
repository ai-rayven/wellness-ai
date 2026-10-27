// Brands: Sano (default) and youmay. The active one is set on <html data-brand> by an inline script in each
// page's <head> (from ?brand= or localStorage) so colors apply before first paint; CSS tokens do the rest.
// mark({ size, mono }) draws the active brand's logo; mono uses currentColor (e.g. white on the accent).

// ---------- Sano: rising sun with rays behind two leaves ----------
const SANO_LEAF_L = 'M48 82 C30 84 11 72 8 50 C30 47 45 60 48 82 Z';
const SANO_LEAF_R = 'M52 82 C70 84 89 70 92 46 C70 44 55 58 52 82 Z';
const SANO_RAYS = [0, -42, 42, -74, 74]
  .map((a) => {
    const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
    return `M${(50 + 29 * s).toFixed(1)} ${(46 - 29 * c).toFixed(1)} L${(50 + 37 * s).toFixed(1)} ${(46 - 37 * c).toFixed(1)}`;
  }).join(' ');
let markId = 0;

// mono adds a knockout around the leaves so they stay separate from the sun.
function sanoMark({ size, mono, label }) {
  const id = 'sano' + markId++;
  const sunFill = mono ? 'currentColor' : `url(#${id}sun)`;
  const leafFill = (side) => (mono ? 'currentColor' : `url(#${id}${side})`);
  return `<svg class="mark" viewBox="0 0 100 100" width="${size}" height="${size}" style="width:${size}px;height:${size}px;flex:none" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="${id}sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8c84a"/><stop offset="1" stop-color="#f0a22e"/></linearGradient>
      <linearGradient id="${id}l" x1="0" y1="0.3" x2="1" y2="1"><stop offset="0" stop-color="#8cc152"/><stop offset="1" stop-color="#2e7d32"/></linearGradient>
      <linearGradient id="${id}r" x1="1" y1="0.2" x2="0" y2="1"><stop offset="0" stop-color="#8cc152"/><stop offset="1" stop-color="#2e7d32"/></linearGradient>
      <mask id="${id}k" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect width="100" height="100" fill="#fff"/>
        ${mono ? `<path d="${SANO_LEAF_L} ${SANO_LEAF_R}" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round"/>` : ''}
      </mask>
    </defs>
    <g mask="url(#${id}k)" fill="${sunFill}">
      <circle cx="50" cy="46" r="22"/>
      <path d="${SANO_RAYS}" stroke="${mono ? 'currentColor' : '#f6b83c'}" stroke-width="7" stroke-linecap="round" fill="none"/>
    </g>
    <path d="${SANO_LEAF_L}" fill="${leafFill('l')}"/>
    <path d="${SANO_LEAF_R}" fill="${leafFill('r')}"/>
  </svg>`;
}

// ---------- youmay: fork + spoon forming a "Y", outline style ----------
// Handles are hollow tubes (masks, so they work on any background); the spoon's opens into its bowl.
// Below 48px the outline closes up, so small sizes draw solid strokes.
const YM_FORK_TUBE = 'M48 92 L48 60 L28.2 31.4';
const YM_FORK_IN = 'M48 92 L48 60 L30.5 34.7';
// Three prongs on a shoulder; their inner lines start just above the shoulder so the outlines join there.
const YM_PRONGS = 'M19.2 37.7 L37.2 25.1 M19.2 37.7 L6.7 19.6 M28.2 31.4 L18 16.6 M37.2 25.1 L24.7 7';
const YM_PRONGS_IN = 'M16.9 34.4 L6.7 19.6 M25.9 28.1 L18 16.6 M34.9 21.8 L24.7 7';
const YM_SPOON_TUBE = 'M48 60 L67.7 30.5';
const YM_SPOON_OPEN = 'M48 60 L72 24';

function youmayMark({ size, mono, label }) {
  const id = 'ym' + markId++;
  const fork = mono ? 'currentColor' : '#e8684f', spoon = mono ? 'currentColor' : '#f2a65a';
  const small = size < 48;
  const [outer, inner] = small ? [10, 0] : [11, 4.5];
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const bowl = (w, c) => `<ellipse cx="76" cy="18" rx="10" ry="15" transform="rotate(33.7 76 18)" fill="${small && c === '#fff' ? '#fff' : 'none'}" stroke="${c}" stroke-width="${w}"/>`;
  const box = 'x="-7" y="-7" width="114" height="114"';
  return `<svg class="mark" viewBox="-7 -7 114 114" width="${size}" height="${size}" style="width:${size}px;height:${size}px;flex:none" role="img" aria-label="${label}">
    <defs>
      <mask id="${id}s" maskUnits="userSpaceOnUse" ${box}>
        <rect ${box} fill="#000"/>
        ${line(YM_SPOON_TUBE, outer, '#fff')}${bowl(outer, '#fff')}
        ${inner ? line(YM_SPOON_OPEN, inner, '#000') + bowl(inner, '#000') : ''}
        ${line(YM_FORK_TUBE, outer + 3, '#000')}${line(YM_PRONGS, outer + 3, '#000')}
      </mask>
      <mask id="${id}f" maskUnits="userSpaceOnUse" ${box}>
        <rect ${box} fill="#000"/>
        ${line(YM_FORK_TUBE, outer, '#fff')}${line(YM_PRONGS, outer, '#fff')}${inner ? line(YM_FORK_IN, inner, '#000') + line(YM_PRONGS_IN, inner, '#000') : ''}
      </mask>
    </defs>
    <rect ${box} fill="${spoon}" mask="url(#${id}s)"/>
    <rect ${box} fill="${fork}" mask="url(#${id}f)"/>
  </svg>`;
}

// ---------- Active brand ----------
const BRANDS = {
  sano: { name: 'Sano', tagline: '', icon: 'icon.png', draw: sanoMark },
  youmay: { name: 'youmay', tagline: 'Track · Eat · Feel good', icon: 'icon-youmay.png', draw: youmayMark },
};
const brandKey = BRANDS[document.documentElement.dataset.brand] ? document.documentElement.dataset.brand : 'sano';
const BRAND = BRANDS[brandKey];
const otherBrand = brandKey === 'sano' ? 'youmay' : 'sano';
try { localStorage.setItem('brand', brandKey); } catch {}

const mark = ({ size = 32, mono = false, label = BRAND.name } = {}) => BRAND.draw({ size, mono, label });
// Small white mark for coach avatars.
const avMark = () => mark({ size: 18, mono: true, label: 'Coach' });

document.querySelectorAll('[data-mark]').forEach((el) => {
  el.innerHTML = mark({ size: +el.dataset.size || 32, mono: el.dataset.mark === 'mono' });
});
document.querySelectorAll('[data-wordmark]').forEach((el) => (el.textContent = BRAND.name));
document.title = document.title.replace('Sano', BRAND.name);
document.querySelectorAll('link[rel=icon], link[rel=apple-touch-icon]').forEach((l) => (l.href = BRAND.icon));

// Switch: reload with ?brand= so it works even where storage is blocked.
document.querySelectorAll('[data-brand-switch]').forEach((el) => {
  el.querySelector('[data-other]').textContent = BRANDS[otherBrand].name;
  el.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.set('brand', otherBrand);
    location.href = url.toString();
  });
});
