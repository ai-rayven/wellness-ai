// youmay brand mark: fork + spoon forming a "Y", outline style.
// Handles are hollow tubes (masks, so they work on any background); the spoon's opens into its bowl.
// Below 48px the outline closes up, so small sizes draw solid strokes.
// Usage: mark({ size, fork, spoon }) → SVG string. Elements with [data-mark] are filled on load.

const FORK_TUBE = 'M48 92 L48 60 L28.2 31.4';
const FORK_IN = 'M48 92 L48 60 L30.5 34.7';
// Three prongs on a shoulder; their inner lines start just above the shoulder so the outlines join there.
const PRONGS = 'M19.2 37.7 L37.2 25.1 M19.2 37.7 L6.7 19.6 M28.2 31.4 L18 16.6 M37.2 25.1 L24.7 7';
const PRONGS_IN = 'M16.9 34.4 L6.7 19.6 M25.9 28.1 L18 16.6 M34.9 21.8 L24.7 7';
const SPOON_TUBE = 'M48 60 L67.7 30.5';
const SPOON_OPEN = 'M48 60 L72 24';
let markId = 0;

function mark({ size = 32, fork = '#e8684f', spoon = '#f2a65a', label = 'youmay' } = {}) {
  const id = 'ym' + markId++;
  const small = size < 48;
  const [outer, inner] = small ? [10, 0] : [11, 4.5];
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const bowl = (w, c) => `<ellipse cx="76" cy="18" rx="10" ry="15" transform="rotate(33.7 76 18)" fill="${small && c === '#fff' ? '#fff' : 'none'}" stroke="${c}" stroke-width="${w}"/>`;
  const box = 'x="-7" y="-7" width="114" height="114"';
  return `<svg class="mark" viewBox="-7 -7 114 114" width="${size}" height="${size}" style="width:${size}px;height:${size}px;flex:none" role="img" aria-label="${label}">
    <defs>
      <mask id="${id}s" maskUnits="userSpaceOnUse" ${box}>
        <rect ${box} fill="#000"/>
        ${line(SPOON_TUBE, outer, '#fff')}${bowl(outer, '#fff')}
        ${inner ? line(SPOON_OPEN, inner, '#000') + bowl(inner, '#000') : ''}
        ${line(FORK_TUBE, outer + 3, '#000')}${line(PRONGS, outer + 3, '#000')}
      </mask>
      <mask id="${id}f" maskUnits="userSpaceOnUse" ${box}>
        <rect ${box} fill="#000"/>
        ${line(FORK_TUBE, outer, '#fff')}${line(PRONGS, outer, '#fff')}${inner ? line(FORK_IN, inner, '#000') + line(PRONGS_IN, inner, '#000') : ''}
      </mask>
    </defs>
    <rect ${box} fill="${spoon}" mask="url(#${id}s)"/>
    <rect ${box} fill="${fork}" mask="url(#${id}f)"/>
  </svg>`;
}

// Small white mark for coach avatars.
const avMark = () => mark({ size: 16, fork: '#fff', spoon: '#fff', label: 'Coach' });

// data-mark="mono" draws it in currentColor (e.g. white on coral).
document.querySelectorAll('[data-mark]').forEach((el) => {
  const mono = el.dataset.mark === 'mono';
  el.innerHTML = mark({ size: +el.dataset.size || 32, ...(mono ? { fork: 'currentColor', spoon: 'currentColor' } : {}) });
});
