import type { JSX } from 'react';
import { cellsOf, type PieceType } from '../engine';

const f1 = (v: number) => +v.toFixed(1);

export const PALETTE: Record<PieceType, { fill: string; dark: string; light: string; accent?: string }> = {
  cube: { fill: '#F3A83F', dark: '#A9631A', light: '#FFDDA0', accent: '#E2513C' },
  tower: { fill: '#CD4A31', dark: '#86281A', light: '#F7E2C7' },
  stair: { fill: '#2D8FD0', dark: '#1A5B8A', light: '#A6DAF7' },
  bridge: { fill: '#8C56AA', dark: '#583275', light: '#D6B6E8' },
  ladder: { fill: '#B8CB6A', dark: '#5F7A24', light: '#E3EFAE' },
  spring: { fill: '#F4E9D6', dark: '#A88E67', light: '#43B4C8', accent: '#1E7F95' },
  long: { fill: '#D9CFBD', dark: '#8C7F6B', light: '#F1EBDF' },
  slide: { fill: '#F08BA8', dark: '#A8405E', light: '#FFD3DF', accent: '#FFD45E' },
  vine: { fill: '#5FA84A', dark: '#2F6B2A', light: '#A8DB8A', accent: '#8A5A2B' },
  bar: { fill: '#E8B66E', dark: '#9A6630', light: '#FBE2B2' },
  corner: { fill: '#E6DCC6', dark: '#8E8268', light: '#FAF6EC' },
  parasol: { fill: '#F4E1B0', dark: '#9C7B43', light: '#FFF6DE', accent: '#E5533D' },
  wave: { fill: '#3D9FD9', dark: '#1F5F8E', light: '#C4E8F8' },
};

function steps(x0: number, x1: number, yb: number, yt: number): [number, number][] {
  const n = 4;
  const sw = (x1 - x0) / n;
  const sh = (yb - yt) / n;
  const a: [number, number][] = [];
  for (let i = 0; i < n; i++) a.push([x0 + i * sw, yb - (i + 1) * sh], [x0 + (i + 1) * sw, yb - (i + 1) * sh]);
  return a;
}

/**
 * The outline of a shape block in its first orientation: 3 units inside its cells like the other blocks, the outer
 * corners rounded more than the inner ones
 */
function outline(t: PieceType): string {
  const cells = cellsOf(t, 0);
  const h = Math.max(...cells.map(([, dy]) => dy)) + 1;
  // Every cell's edges, clockwise on screen; an edge two cells share runs both ways and drops out, leaving the outline
  const edges = cells.flatMap(([cx, dy]): [number, number, number, number][] => {
    const cy = h - 1 - dy;
    return [
      [cx, cy, cx + 1, cy],
      [cx + 1, cy, cx + 1, cy + 1],
      [cx + 1, cy + 1, cx, cy + 1],
      [cx, cy + 1, cx, cy],
    ];
  });
  const all = new Set(edges.map((e) => e.join()));
  const next = new Map<string, [number, number]>();
  for (const [ax, ay, bx, by] of edges) if (!all.has([bx, by, ax, ay].join())) next.set(`${ax},${ay}`, [bx, by]);
  const loop: [number, number][] = [];
  let at = [...next.keys()][0].split(',').map(Number) as [number, number];
  do {
    loop.push(at);
    at = next.get(at.join()) as [number, number];
  } while (at.join() !== loop[0].join());
  // The corners, each moved 3 units inside: the inside is on the right of the way round
  const n = loop.length;
  const way = (a: [number, number], b: [number, number]) => [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
  const corners: { x: number; y: number; r: number }[] = [];
  loop.forEach((v, i) => {
    const [ix, iy] = way(loop[(i + n - 1) % n], v);
    const [ox, oy] = way(v, loop[(i + 1) % n]);
    const turn = ix * oy - iy * ox;
    if (turn) corners.push({ x: v[0] * 100 - 3 * (iy + oy), y: v[1] * 100 + 3 * (ix + ox), r: turn > 0 ? 12 : 6 });
  });
  return `${corners
    .map((c, i) => {
      const toward = (q: { x: number; y: number }) => {
        const len = Math.hypot(q.x - c.x, q.y - c.y);
        return `${f1(c.x + ((q.x - c.x) / len) * c.r)},${f1(c.y + ((q.y - c.y) / len) * c.r)}`;
      };
      const m = corners.length;
      return `${i ? 'L' : 'M'}${toward(corners[(i + m - 1) % m])} Q${f1(c.x)},${f1(c.y)} ${toward(corners[(i + 1) % m])}`;
    })
    .join(' ')} Z`;
}

/** A drawing made for a block's first orientation (`w`×`h` cells), turned the quarter turns clockwise orientation `o` is */
function turned(o: number, w: number, h: number, body: JSX.Element): JSX.Element {
  const tf = ['', `translate(${h * 100},0) rotate(90)`, `translate(${w * 100},${h * 100}) rotate(180)`, `translate(0,${w * 100}) rotate(270)`][o];
  return tf ? <g transform={tf}>{body}</g> : body;
}

/** One block drawn in local units (100 per cell, origin at the piece's top-left) */
export function PieceArt({ t, o }: { t: PieceType; o: number }) {
  const p = PALETTE[t];
  const shine = (x2: number) => <path d={`M17,13 H${x2}`} stroke={p.light} strokeWidth={5} strokeLinecap="round" opacity={0.7} />;
  switch (t) {
    case 'cube':
      return (
        <g>
          <rect x={3} y={3} width={94} height={94} rx={12} fill={p.fill} stroke={p.dark} strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = ((i * 72 - 90) * Math.PI) / 180;
            return <circle key={i} cx={f1(50 + Math.cos(a) * 13)} cy={f1(54 + Math.sin(a) * 13)} r={10} fill={p.accent} />;
          })}
          <circle cx={50} cy={54} r={7} fill={p.light} />
          <ellipse cx={77} cy={79} rx={11} ry={5.5} transform="rotate(-35 77 79)" fill="#3E9B6E" />
          <ellipse cx={24} cy={31} rx={9} ry={4.5} transform="rotate(-35 24 31)" fill="#3E9B6E" />
          {shine(56)}
        </g>
      );
    case 'tower':
      // Lying down is the standing tower turned on its side
      return turned(
        o,
        1,
        2,
        <g>
          <rect x={3} y={3} width={94} height={194} rx={12} fill={p.fill} stroke={p.dark} strokeWidth={4} />
          <rect x={8} y={8} width={84} height={14} rx={7} fill={p.light} />
          {[0, 1, 2, 3, 4, 5].map((r) => {
            const odd = r % 2;
            const d = `M${odd ? 20 : 10},${42 + r * 27}${' a10,9 0 0 0 20,0'.repeat(odd ? 3 : 4)}`;
            return <path key={r} d={d} fill="none" stroke={p.light} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />;
          })}
        </g>,
      );
    case 'bridge':
      return (
        <g>
          <path
            d="M15,3 H85 Q97,3 97,15 V97 H81 V50 A31,31 0 0 0 19,50 V97 H3 V15 Q3,3 15,3 Z"
            fill={p.fill}
            stroke={p.dark}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <path d="M11,13 H89" stroke={p.light} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
          <path d="M8,62 H15 M8,80 H15 M85,62 H92 M85,80 H92" stroke={p.dark} strokeWidth={2.5} opacity={0.45} strokeLinecap="round" />
        </g>
      );
    case 'ladder':
      return (
        <g>
          <rect x={12} y={10} width={13} height={187} rx={6} fill={p.fill} stroke={p.dark} strokeWidth={3} />
          <rect x={75} y={10} width={13} height={187} rx={6} fill={p.fill} stroke={p.dark} strokeWidth={3} />
          {[44, 72, 140, 170].map((y) => (
            <rect key={y} x={22} y={y - 4} width={56} height={8} rx={4} fill={p.fill} stroke={p.dark} strokeWidth={2.5} />
          ))}
          {[60, 120, 160].map((y) => (
            <path key={y} d={`M12,${y} H25 M75,${y} H88`} stroke={p.dark} strokeWidth={2.5} />
          ))}
          <rect x={4} y={96} width={92} height={9} rx={4} fill={p.light} stroke={p.dark} strokeWidth={2.5} />
          <rect x={3} y={3} width={94} height={14} rx={6} fill={p.light} stroke={p.dark} strokeWidth={3} />
        </g>
      );
    case 'spring': {
      let d = 'M6,97 V58';
      for (let i = 0; i < 5; i++) d += ` Q${f1(6 + i * 17.6 + 8.8)},46 ${f1(6 + (i + 1) * 17.6)},58`;
      d += ' V97 Z';
      return (
        <g>
          <ellipse cx={50} cy={30} rx={40} ry={24} fill={p.light} stroke={p.accent} strokeWidth={3.5} />
          <circle cx={34} cy={26} r={4} fill="#9FE3EE" />
          <circle cx={52} cy={20} r={3} fill="#9FE3EE" />
          <circle cx={66} cy={30} r={4} fill="#9FE3EE" />
          <circle cx={44} cy={38} r={2.5} fill="#9FE3EE" />
          <path d={d} fill={p.fill} stroke={p.dark} strokeWidth={3.5} strokeLinejoin="round" />
          {[1, 2, 3, 4].map((i) => (
            <path key={i} d={`M50,95 L${f1(6 + i * 17.6)},58`} stroke={p.dark} strokeWidth={2} opacity={0.55} />
          ))}
        </g>
      );
    }
    case 'long':
      return (
        <g>
          <path
            d="M15,3 H285 Q297,3 297,15 V97 H181 V50 A31,31 0 0 0 119,50 V97 H3 V15 Q3,3 15,3 Z"
            fill={p.fill}
            stroke={p.dark}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <rect x={8} y={8} width={284} height={10} rx={5} fill={p.light} />
          <path
            d="M10,44 H100 M200,44 H290 M10,74 H100 M200,74 H290 M55,18 V44 M30,44 V74 M78,44 V74 M245,18 V44 M222,44 V74 M270,44 V74"
            stroke={p.dark}
            strokeWidth={2}
            opacity={0.4}
          />
        </g>
      );
    case 'slide': {
      // Platform on the high side, a smooth chute curving down to the floor on the other
      const body = (
        <>
          <path
            d="M15,3 H100 C128,3 146,24 160,52 C172,76 182,92 197,92 V97 H3 V15 Q3,3 15,3 Z"
            fill={p.fill}
            stroke={p.dark}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <path d="M100,10 C126,10 142,30 154,56 C166,80 178,88 192,88" stroke={p.accent} strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M100,10 C126,10 142,30 154,56 C166,80 178,88 192,88" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
          {[24, 50, 76].map((y) => (
            <path key={y} d={`M14,${y + 8} H86`} stroke={p.light} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
          ))}
          <path d="M104,97 V40 M132,97 V36 M160,97 V64" stroke={p.dark} strokeWidth={2.5} opacity={0.35} strokeLinecap="round" />
        </>
      );
      return o === 1 ? <g transform="translate(200,0) scale(-1,1)">{body}</g> : <g>{body}</g>;
    }
    case 'vine': {
      // Hangs from the block above: a knotted root at the top, two twisting stems and leaves
      const stem = (x: number, k: number) => `M${x},6 C${x + 16 * k},40 ${x - 16 * k},80 ${x},110 S${x + 14 * k},170 ${x - 4 * k},194`;
      const leaves: [number, number, number][] = [
        [30, 40, -30],
        [70, 62, 30],
        [26, 100, -40],
        [72, 128, 35],
        [30, 160, -30],
        [66, 186, 40],
      ];
      return (
        <g>
          <path d={stem(42, 1)} stroke={p.accent} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d={stem(58, -1)} stroke={p.dark} strokeWidth={6} fill="none" strokeLinecap="round" />
          {leaves.map(([x, y, r]) => (
            <ellipse key={y} cx={x} cy={y} rx={14} ry={7.5} transform={`rotate(${r} ${x} ${y})`} fill={p.fill} stroke={p.dark} strokeWidth={2.5} />
          ))}
          <rect x={24} y={2} width={52} height={10} rx={5} fill={p.accent} stroke="#5A3A1A" strokeWidth={2.5} />
        </g>
      );
    }
    case 'stair': {
      const horiz = o === 0 || o === 3;
      const mirror = o === 2 || o === 3;
      const st = horiz ? steps(3, 100, 97, 3) : steps(3, 97, 100, 3);
      const pts: [number, number][] = horiz ? [[3, 97], ...st, [197, 3], [197, 97]] : [[3, 197], ...st, [97, 197]];
      const cx = horiz ? 150 : 50;
      const cy = horiz ? 50 : 150;
      const body = (
        <>
          <polygon points={pts.map((q) => q.map(f1).join(',')).join(' ')} fill={p.fill} stroke={p.dark} strokeWidth={4} strokeLinejoin="round" />
          {[1, 3, 5, 7].map((i) => {
            const [xa, y] = st[i - 1];
            const [xb] = st[i];
            return <path key={i} d={`M${f1(xa + 5)},${f1(y + 5)} H${f1(xb - 4)}`} stroke={p.light} strokeWidth={3} strokeLinecap="round" opacity={0.75} />;
          })}
          <rect x={cx - 17} y={cy - 17} width={34} height={34} rx={7} fill={p.light} stroke={p.dark} strokeWidth={3} />
          <circle cx={cx - 6} cy={cy + 5} r={3.5} fill="#fff" />
          <circle cx={cx + 5} cy={cy - 6} r={2.5} fill="#fff" />
        </>
      );
      return mirror ? <g transform={`translate(${horiz ? 200 : 100},0) scale(-1,1)`}>{body}</g> : <g>{body}</g>;
    }
    // The shape blocks are drawn lying in their first orientation and turn with the block, like a real one
    case 'bar':
      // A chinsuko biscuit with the ridges along its top
      return turned(
        o,
        3,
        1,
        <g>
          <path d={outline(t)} fill={p.fill} stroke={p.dark} strokeWidth={4} strokeLinejoin="round" />
          {[38, 58, 78].map((y) => (
            <path key={y} d={`M18,${y} q12,-7 24,0${' t24,0'.repeat(10)}`} fill="none" stroke={p.dark} strokeWidth={3} strokeLinecap="round" opacity={0.35} />
          ))}
          {shine(150)}
        </g>,
      );
    case 'corner':
      // Coral stone laid in courses, with the little holes coral stone has
      return turned(
        o,
        2,
        2,
        <g>
          <path d={outline(t)} fill={p.fill} stroke={p.dark} strokeWidth={4} strokeLinejoin="round" />
          <path
            d="M8,50 H92 M8,100 H92 M8,150 H192 M50,8 V50 M25,50 V100 M75,50 V100 M50,100 V150 M150,108 V150 M25,150 V192 M100,150 V192 M170,150 V192"
            stroke={p.dark}
            strokeWidth={2.5}
            opacity={0.4}
            strokeLinecap="round"
          />
          {[
            [30, 28],
            [70, 80],
            [118, 128],
            [62, 172],
            [138, 176],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={3} fill={p.dark} opacity={0.3} />
          ))}
          {shine(56)}
        </g>,
      );
    case 'parasol':
      // A striped beach parasol open over its pole, on a patch of sand
      return turned(
        o,
        3,
        2,
        <g>
          <path d={outline(t)} fill={p.fill} stroke={p.dark} strokeWidth={4} strokeLinejoin="round" />
          <rect x={10} y={10} width={280} height={80} rx={9} fill={p.accent} />
          <rect x={103} y={10} width={94} height={80} fill={p.light} />
          <path d="M22,22 H84" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
          <rect x={143} y={88} width={14} height={104} rx={6} fill="#8A5A2B" stroke="#5A3A1A" strokeWidth={2.5} />
        </g>,
      );
    case 'wave': {
      // Waves breaking along each row; turned over, it is the same wave drawn the other way round
      const body = (
        <g>
          <path d={outline(t)} fill={p.fill} stroke={p.dark} strokeWidth={4} strokeLinejoin="round" />
          {[
            [114, 58],
            [14, 158],
          ].map(([x, y]) => (
            <g key={y} fill="none" stroke={p.light} strokeLinecap="round">
              <path d={`M${x},${y} q12,-14 24,0${' t24,0'.repeat(6)}`} strokeWidth={4.5} />
              <path d={`M${x + 24},${y + 24} q12,-10 24,0${' t24,0'.repeat(4)}`} strokeWidth={3} opacity={0.6} />
            </g>
          ))}
          <path d="M117,13 H156" stroke={p.light} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        </g>
      );
      const lying = o % 2 === 0;
      const art = turned(lying ? 0 : 1, 3, 2, body);
      return o < 2 ? art : <g transform={`translate(${lying ? 300 : 200},0) scale(-1,1)`}>{art}</g>;
    }
  }
}
