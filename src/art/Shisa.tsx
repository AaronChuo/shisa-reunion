import { type ReactNode, useId } from 'react';
import type { Variant } from '../content/shisa';

const f1 = (v: number) => +v.toFixed(1);
const BODY = 'M-22,-2 C-26,-26 -18,-40 0,-40 C18,-40 26,-26 22,-2 Z';

export function Star4({ x, y, r, fill, className }: { x: number; y: number; r: number; fill: string; className?: string }) {
  const q = r * 0.25;
  return (
    <path
      className={className}
      d={`M${x},${y - r} L${f1(x + q)},${f1(y - q)} L${x + r},${y} L${f1(x + q)},${f1(y + q)} L${x},${y + r} L${f1(x - q)},${f1(y + q)} L${x - r},${y} L${f1(x - q)},${f1(y - q)} Z`}
      fill={fill}
    />
  );
}

const grid = (step: number, shift: number, x0: number, x1: number, y0: number, y1: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = y0; y < y1; y += step) for (let x = x0 + (Math.round((y - y0) / step) % 2 ? shift : 0); x <= x1; x += step) out.push([x, y]);
  return out;
};

function Pattern({ v }: { v: Variant }): ReactNode {
  switch (v.pattern) {
    case 'dots':
      return grid(9, 4, -20, 22, -34, 0).map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={2.6} fill={v.face} />);
    case 'stripes':
      return [-24, -12, 0, 12, 24].map((x) => <rect key={x} x={x} y={-42} width={6} height={42} fill={v.stripe} />);
    case 'shell':
      return (
        [
          [0, -22],
          [-13, -12],
          [13, -12],
          [-13, -32],
          [13, -32],
          [0, -4],
        ] as const
      ).map(([cx, cy]) => {
        let d = '';
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          d += `${i ? 'L' : 'M'}${f1(cx + Math.cos(a) * 8)},${f1(cy + Math.sin(a) * 8)}`;
        }
        return <path key={`${cx},${cy}`} d={`${d}Z`} fill={v.face} fillOpacity={0.45} stroke={v.dark} strokeWidth={1.8} />;
      });
    case 'stars':
      return (
        [
          [-12, -28],
          [10, -20],
          [-4, -10],
          [14, -34],
          [-16, -8],
        ] as const
      ).map(([x, y]) => <Star4 key={`${x},${y}`} x={x} y={y} r={4} fill="#FFFFFF" />);
    case 'spots':
      return (
        [
          [-12, -30, 3],
          [6, -32, 2.5],
          [14, -20, 3.2],
          [-6, -18, 2.6],
          [-16, -10, 2.2],
          [8, -8, 3],
          [0, -26, 2],
        ] as const
      ).map(([x, y, r]) => <circle key={`${x},${y}`} cx={x} cy={y} r={r} fill="#EAF4FF" />);
    case 'bumps':
      return grid(8, 4, -20, 22, -34, 0).map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r={3} fill={typeof v.mane === 'string' ? v.mane : v.mane[0]} />
      ));
    case 'crumbs':
      return (
        [
          [-12, -30],
          [8, -26],
          [14, -12],
          [-6, -14],
          [-16, -6],
          [4, -36],
          [0, -6],
          [-10, -22],
        ] as const
      ).map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={1.6} fill={v.dark} opacity={0.55} />);
    case 'crystals':
      return (
        [
          [-12, -28],
          [8, -22],
          [-4, -10],
          [14, -34],
          [16, -8],
        ] as const
      ).map(([x, y]) => <path key={`${x},${y}`} d={`M${x},${y - 4} L${x + 3},${y} L${x},${y + 4} L${x - 3},${y} Z`} fill="#E9C9A0" opacity={0.85} />);
    case 'flowers':
      return (
        [
          [-12, -26, '#D9443A'],
          [10, -16, '#2D8FD0'],
          [-4, -8, '#3E9B6E'],
          [14, -34, '#D9443A'],
        ] as const
      ).map(([x, y, c]) => (
        <g key={`${x},${y}`}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = ((i * 72 - 90) * Math.PI) / 180;
            return <circle key={i} cx={f1(x + Math.cos(a) * 3.4)} cy={f1(y + Math.sin(a) * 3.4)} r={2.6} fill={c} />;
          })}
          <circle cx={x} cy={y} r={1.8} fill="#FFF2B0" />
        </g>
      ));
    case 'scales':
      return grid(7, 4, -24, 24, -36, 0).map(([x, y]) => (
        <path key={`${x},${y}`} d={`M${x - 4},${y} a4,4 0 0 0 8,0`} fill="none" stroke={v.face} strokeWidth={1.6} />
      ));
    case 'burst':
      return (
        [
          [-9, -24, '#FFD34E'],
          [10, -12, '#FF8FB1'],
          [8, -32, '#7CC8F2'],
        ] as const
      ).map(([cx, cy, col]) => (
        <g key={`${cx},${cy}`}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            return (
              <path
                key={i}
                d={`M${f1(cx + Math.cos(a) * 2)},${f1(cy + Math.sin(a) * 2)} L${f1(cx + Math.cos(a) * 7)},${f1(cy + Math.sin(a) * 7)}`}
                stroke={col}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ));
    default:
      return null;
  }
}

function Hat({ v }: { v: Variant }) {
  switch (v.hat) {
    case 'starfish': {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = ((i * 36 - 90) * Math.PI) / 180;
        const r = i % 2 ? 4 : 10;
        d += `${i ? 'L' : 'M'}${f1(-16 + Math.cos(a) * r)},${f1(-80 + Math.sin(a) * r)}`;
      }
      return <path d={`${d}Z`} fill="#F28C38" stroke="#B5531A" strokeWidth={2} strokeLinejoin="round" />;
    }
    case 'leaf':
      return (
        <>
          <path d="M2,-80 C8,-96 26,-96 26,-86 C20,-78 8,-76 2,-80 Z" fill="#4E9A3A" stroke="#2C5E1F" strokeWidth={2} />
          <path d="M4,-81 C12,-86 18,-88 24,-87" stroke="#2C5E1F" strokeWidth={1.5} fill="none" />
        </>
      );
    case 'bean':
      return (
        <>
          <ellipse cx={0} cy={-86} rx={7} ry={6} fill="#8E2A2A" stroke="#5A1414" strokeWidth={2} />
          <circle cx={-2} cy={-88} r={1.8} fill="#fff" opacity={0.8} />
        </>
      );
    case 'band':
      return (
        <>
          <rect x={-23} y={-73} width={46} height={8} rx={3} fill="#FFFFFF" stroke="#D9443A" strokeWidth={2} />
          <path d="M22,-70 l10,-6 l-2,9 Z M22,-69 l9,5 l-8,3 Z" fill="#D9443A" />
        </>
      );
    case 'crown':
      return (
        <>
          <path d="M-15,-78 L-15,-92 L-7,-85 L0,-96 L7,-85 L15,-92 L15,-78 Z" fill="#F6C945" stroke="#A87C10" strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={0} cy={-84} r={2.6} fill="#D9443A" />
          <circle cx={-9} cy={-82} r={2} fill="#2D8FD0" />
          <circle cx={9} cy={-82} r={2} fill="#2D8FD0" />
        </>
      );
    default:
      return null;
  }
}

/**
 * A shisa standing with its feet at (0, 0), about 90 units tall.
 * open = the one that sets out (阿, open mouth); closed = the one waiting (吽).
 * sil = locked silhouette for collection slots not yet pulled.
 */
export function ShisaArt({ v, open, sil = false }: { v: Variant; open: boolean; sil?: boolean }) {
  const id = useId();
  const body = sil ? '#BFCFCC' : v.body;
  const face = sil ? '#BFCFCC' : v.face;
  const dark = sil ? '#A2B4B1' : v.dark;
  const manes = sil ? ['#AFC1BE'] : Array.isArray(v.mane) ? v.mane : [v.mane];
  const hasPattern = !sil && v.pattern && v.pattern !== 'drum';
  return (
    <g transform="scale(.9)">
      <ellipse cx={0} cy={-2} rx={30} ry={6} fill="rgba(0,0,0,.16)" />
      <path d="M17,-22 q24,-4 18,-27 q-4,-10 -13,-4" fill="none" stroke={manes[0]} strokeWidth={7} strokeLinecap="round" />
      <path d={BODY} fill={body} stroke={dark} strokeWidth={3} />
      {hasPattern && (
        <>
          <clipPath id={`b${id}`}>
            <path d={BODY} />
          </clipPath>
          <g clipPath={`url(#b${id})`}>
            <Pattern v={v} />
          </g>
        </>
      )}
      <rect x={-17} y={-14} width={12} height={13} rx={6} fill={face} stroke={dark} strokeWidth={2.5} />
      <rect x={5} y={-14} width={12} height={13} rx={6} fill={face} stroke={dark} strokeWidth={2.5} />
      {!sil && v.pattern === 'drum' ? (
        <g transform="translate(0,-21)">
          <rect x={-12} y={-4} width={24} height={12} rx={2} fill="#F5E6C8" stroke="#5A130D" strokeWidth={2} />
          <ellipse cx={0} cy={-4} rx={12} ry={4} fill="#FFF8EA" stroke="#5A130D" strokeWidth={2} />
          <path d="M-10,2 L10,2" stroke="#D9443A" strokeWidth={3} />
        </g>
      ) : (
        <path d="M-7,-27 q7,-7 14,0" fill="none" stroke={manes[0]} strokeWidth={3.5} strokeLinecap="round" />
      )}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={f1(Math.cos(a) * 25)} cy={f1(-56 + Math.sin(a) * 23)} r={9} fill={manes[i % manes.length]} />;
      })}
      <circle cx={0} cy={-56} r={21} fill={face} />
      {sil ? (
        <text x={0} y={-46} textAnchor="middle" fontSize={28} fontWeight={700} fill="#8EA3A0" fontFamily="Fredoka, sans-serif">
          ?
        </text>
      ) : (
        <>
          <path d="M-15,-66 q6,-6 11,-1 M4,-67 q5,-5 11,1" fill="none" stroke={dark} strokeWidth={3.5} strokeLinecap="round" />
          <circle cx={-8} cy={-59} r={5.5} fill="#fff" />
          <circle cx={8} cy={-59} r={5.5} fill="#fff" />
          <circle cx={-7} cy={-58.5} r={3} fill="#1d1d1d" />
          <circle cx={9} cy={-58.5} r={3} fill="#1d1d1d" />
          <ellipse cx={0} cy={-51} rx={7} ry={4.5} fill={dark} />
          {open ? (
            <>
              <path d="M-11,-45 Q0,-29 11,-45 Z" fill="#7A1E12" />
              <path d="M-8,-45 l3,4 l3,-4 Z M2,-45 l3,4 l3,-4 Z" fill="#fff" />
            </>
          ) : (
            <path d="M-10,-44 Q-5,-40 0,-44 Q5,-40 10,-44" fill="none" stroke={dark} strokeWidth={3} strokeLinecap="round" />
          )}
          <circle cx={-15} cy={-48} r={3.5} fill="#FF9C8A" opacity={0.75} />
          <circle cx={15} cy={-48} r={3.5} fill="#FF9C8A" opacity={0.75} />
          <Hat v={v} />
          {v.sparkle && (
            <>
              <Star4 x={-32} y={-84} r={6} fill="#FFE27A" className="twinkle" />
              <Star4 x={34} y={-64} r={5} fill="#FFFFFF" className="twinkle" />
              <Star4 x={30} y={-96} r={4} fill="#FFE27A" className="twinkle" />
            </>
          )}
        </>
      )}
    </g>
  );
}

/** A shisa framed for a standalone square icon */
export function ShisaIcon({ v, open, sil, className }: { v: Variant; open: boolean; sil?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="-46 -100 92 104" aria-hidden="true">
      <ShisaArt v={v} open={open} sil={sil} />
    </svg>
  );
}
