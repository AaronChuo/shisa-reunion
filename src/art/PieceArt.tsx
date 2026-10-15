import type { PieceType } from '../engine';

const f1 = (v: number) => +v.toFixed(1);

export const PALETTE: Record<PieceType, { fill: string; dark: string; light: string; accent?: string }> = {
  cube: { fill: '#F3A83F', dark: '#A9631A', light: '#FFDDA0', accent: '#E2513C' },
  tower: { fill: '#CD4A31', dark: '#86281A', light: '#F7E2C7' },
  stair: { fill: '#2D8FD0', dark: '#1A5B8A', light: '#A6DAF7' },
  bridge: { fill: '#8C56AA', dark: '#583275', light: '#D6B6E8' },
  ladder: { fill: '#B8CB6A', dark: '#5F7A24', light: '#E3EFAE' },
  spring: { fill: '#F4E9D6', dark: '#A88E67', light: '#43B4C8', accent: '#1E7F95' },
  long: { fill: '#D9CFBD', dark: '#8C7F6B', light: '#F1EBDF' },
};

function steps(x0: number, x1: number, yb: number, yt: number): [number, number][] {
  const n = 4;
  const sw = (x1 - x0) / n;
  const sh = (yb - yt) / n;
  const a: [number, number][] = [];
  for (let i = 0; i < n; i++) a.push([x0 + i * sw, yb - (i + 1) * sh], [x0 + (i + 1) * sw, yb - (i + 1) * sh]);
  return a;
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
      return (
        <g>
          <rect x={3} y={3} width={94} height={194} rx={12} fill={p.fill} stroke={p.dark} strokeWidth={4} />
          <rect x={8} y={8} width={84} height={14} rx={7} fill={p.light} />
          {[0, 1, 2, 3, 4, 5].map((r) => {
            const odd = r % 2;
            const d = `M${odd ? 20 : 10},${42 + r * 27}${' a10,9 0 0 0 20,0'.repeat(odd ? 3 : 4)}`;
            return <path key={r} d={d} fill="none" stroke={p.light} strokeWidth={3.5} strokeLinecap="round" opacity={0.85} />;
          })}
        </g>
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
  }
}
