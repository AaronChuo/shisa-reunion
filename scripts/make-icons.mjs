// Renders the app icons (favicon, PWA icons, Apple touch icon) from one SVG of the terracotta shisa.
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const c = { body: '#E8743E', face: '#F39A5E', mane: '#B34A24', dark: '#7C2E14' };
const f1 = (v) => +v.toFixed(1);

function shisa() {
  let s = `<path d="M17,-22 q24,-4 18,-27 q-4,-10 -13,-4" fill="none" stroke="${c.mane}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M-22,-2 C-26,-26 -18,-40 0,-40 C18,-40 26,-26 22,-2 Z" fill="${c.body}" stroke="${c.dark}" stroke-width="3"/>`;
  s += `<rect x="-17" y="-14" width="12" height="13" rx="6" fill="${c.face}" stroke="${c.dark}" stroke-width="2.5"/><rect x="5" y="-14" width="12" height="13" rx="6" fill="${c.face}" stroke="${c.dark}" stroke-width="2.5"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    s += `<circle cx="${f1(Math.cos(a) * 25)}" cy="${f1(-56 + Math.sin(a) * 23)}" r="9" fill="${c.mane}"/>`;
  }
  s += `<circle cx="0" cy="-56" r="21" fill="${c.face}"/>`;
  s += `<path d="M-15,-66 q6,-6 11,-1 M4,-67 q5,-5 11,1" fill="none" stroke="${c.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
  s += `<circle cx="-8" cy="-59" r="5.5" fill="#fff"/><circle cx="8" cy="-59" r="5.5" fill="#fff"/><circle cx="-7" cy="-58.5" r="3" fill="#1d1d1d"/><circle cx="9" cy="-58.5" r="3" fill="#1d1d1d"/>`;
  s += `<ellipse cx="0" cy="-51" rx="7" ry="4.5" fill="${c.dark}"/>`;
  s += `<path d="M-11,-45 Q0,-29 11,-45 Z" fill="#7A1E12"/><path d="M-8,-45 l3,4 l3,-4 Z M2,-45 l3,4 l3,-4 Z" fill="#fff"/>`;
  s += `<circle cx="-15" cy="-48" r="3.5" fill="#FF9C8A" opacity=".75"/><circle cx="15" cy="-48" r="3.5" fill="#FF9C8A" opacity=".75"/>`;
  return s;
}

/** pad: share of the canvas kept clear around the artwork (maskable icons need ~10%+) */
function icon(pad, rounded) {
  const r = rounded ? 112 : 0;
  const scale = (512 * (1 - pad * 2)) / 100;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><title>西薩搭搭路</title>
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93D2E8"/><stop offset=".72" stop-color="#E6F6F3"/></linearGradient></defs>
  <rect width="512" height="512" rx="${r}" fill="url(#g)"/>
  <path d="M0,${512 * 0.8} H512 V512 H0 Z" fill="#3DB0C1"/>
  <rect x="${512 * 0.18}" y="${512 * 0.76}" width="${512 * 0.64}" height="${512 * 0.07}" rx="14" fill="#CFA471" stroke="#8E6435" stroke-width="8"/>
  <g transform="translate(256 ${512 * 0.765}) scale(${scale * 0.94})">${shisa()}</g>
</svg>`;
}

const png = (svg, size, out) => {
  const data = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(out, data);
  console.log(out, `${(data.length / 1024).toFixed(1)} KB`);
};

writeFileSync('public/favicon.svg', icon(0.06, true));
png(icon(0.06, true), 192, 'public/icon-192.png');
png(icon(0.06, true), 512, 'public/icon-512.png');
png(icon(0.18, false), 512, 'public/icon-maskable-512.png');
png(icon(0.08, false), 180, 'public/apple-touch-icon.png');
