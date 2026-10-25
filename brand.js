// Sano brand mark: a rising sun with rays behind two leaves.
// Usage: mark({ size, mono }) → SVG string. mono draws everything in currentColor (e.g. white on green),
// with a knockout around the leaves so they stay separate from the sun.
// Elements with [data-mark] (optionally ="mono") are filled on load.

const LEAF_L = 'M48 82 C30 84 11 72 8 50 C30 47 45 60 48 82 Z';
const LEAF_R = 'M52 82 C70 84 89 70 92 46 C70 44 55 58 52 82 Z';
const RAYS = [0, -42, 42, -74, 74]
  .map((a) => {
    const r = (a * Math.PI) / 180, s = Math.sin(r), c = Math.cos(r);
    return `M${(50 + 29 * s).toFixed(1)} ${(46 - 29 * c).toFixed(1)} L${(50 + 37 * s).toFixed(1)} ${(46 - 37 * c).toFixed(1)}`;
  }).join(' ');
let markId = 0;

function mark({ size = 32, mono = false, label = 'Sano' } = {}) {
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
        ${mono ? `<path d="${LEAF_L} ${LEAF_R}" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round"/>` : ''}
      </mask>
    </defs>
    <g mask="url(#${id}k)" fill="${sunFill}">
      <circle cx="50" cy="46" r="22"/>
      <path d="${RAYS}" stroke="${mono ? 'currentColor' : '#f6b83c'}" stroke-width="7" stroke-linecap="round" fill="none"/>
    </g>
    <path d="${LEAF_L}" fill="${leafFill('l')}"/>
    <path d="${LEAF_R}" fill="${leafFill('r')}"/>
  </svg>`;
}

// Small white mark for coach avatars.
const avMark = () => mark({ size: 18, mono: true, label: 'Coach' });

document.querySelectorAll('[data-mark]').forEach((el) => {
  el.innerHTML = mark({ size: +el.dataset.size || 32, mono: el.dataset.mark === 'mono' });
});
