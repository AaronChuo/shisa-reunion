import { type ReactNode, useId, useState } from 'react';
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
    case 'stone':
      return grid(7, 3, -22, 22, -38, 0).map(([x, y], i) => (
        <circle key={`${x},${y}`} cx={x + (i % 3) - 1} cy={y} r={1.2 + (i % 4) * 0.35} fill={i % 2 ? v.dark : v.face} opacity={i % 2 ? 0.35 : 0.6} />
      ));
    case 'masonry':
      return (
        <path
          d="M-24,-32 H24 M-24,-21 H24 M-24,-10 H24 M-8,-40 V-32 M10,-40 V-32 M0,-32 V-21 M16,-32 V-21 M-14,-32 V-21 M-6,-21 V-10 M10,-21 V-10 M2,-10 V0 M-14,-10 V0 M16,-10 V0"
          stroke={v.dark}
          strokeWidth={1.6}
          opacity={0.35}
          fill="none"
        />
      );
    case 'shards':
      return (
        <path
          d="M-22,-30 L-8,-26 L-2,-38 M-8,-26 L-4,-14 L-22,-10 M-4,-14 L10,-20 L22,-14 M10,-20 L6,-36 M-4,-14 L2,0 M10,-20 L14,-4"
          stroke={typeof v.mane === 'string' ? v.mane : v.mane[0]}
          strokeWidth={2.4}
          strokeLinejoin="round"
          fill="none"
        />
      );
    case 'minsa':
      // Yaeyama minsa weave: rows of five and four squares, "itsu (5) no yo (4) made", for ever and ever
      return (
        <>
          <path d="M-24,-36 H24 M-24,-4 H24" stroke="#2B3F7A" strokeWidth={2} strokeDasharray="3 2" />
          {(
            [
              [-30, [-14, -7, 0, 7, 14]],
              [-20, [-10.5, -3.5, 3.5, 10.5]],
              [-10, [-14, -7, 0, 7, 14]],
            ] as const
          ).flatMap(([y, xs]) => xs.map((x) => <rect key={`${x},${y}`} x={x - 2.5} y={y - 2.5} width={5} height={5} fill="#2B3F7A" />))}
        </>
      );
    case 'patches':
      return [-1, 1].map((k) => <ellipse key={k} cx={k * 11} cy={-31} rx={8} ry={4.5} transform={`rotate(${k * 24} ${k * 11} -31)`} fill={v.face} />);
    case 'bands':
      return [-11, 11].map((x) => (
        <g key={x}>
          <path d={`M${x},-44 q${x > 0 ? 4 : -4},22 0,46`} stroke="#1d1d1d" strokeWidth={10} fill="none" />
          <path d={`M${x},-44 q${x > 0 ? 4 : -4},22 0,46`} stroke="#FFFFFF" strokeWidth={6.5} fill="none" />
        </g>
      ));
    case 'bubbles':
      return (
        [
          [-12, -30, 4],
          [8, -24, 3],
          [14, -36, 2.2],
          [-4, -14, 2.6],
          [12, -8, 3.6],
          [-16, -8, 2],
          [2, -34, 1.8],
        ] as const
      ).map(([x, y, r]) => <circle key={`${x},${y}`} cx={x} cy={y} r={r} fill="#FFFFFF" fillOpacity={0.3} stroke="#FFFFFF" strokeWidth={1.3} />);
    case 'cracks':
      return (
        <path
          d="M-16,-30 q6,6 12,0 M4,-24 q6,6 12,0 M-10,-14 q6,6 12,0 M8,-8 q4,4 8,0"
          stroke={v.dark}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      );
    case 'noodles':
      return [-34, -27, -20, -13, -6].map((y) => (
        <path key={y} d={`M-26,${y} q4,-3 8,0 t8,0 t8,0 t8,0 t8,0 t8,0 t8,0`} stroke={v.mane as string} strokeWidth={2.2} fill="none" />
      ));
    case 'confetti': {
      const cols = Array.isArray(v.mane) ? v.mane : [v.mane];
      return grid(9, 4, -20, 22, -36, 0).map(([x, y], i) => (
        <rect
          key={`${x},${y}`}
          x={x - 2.5}
          y={y - 1.5}
          width={5}
          height={3}
          rx={1}
          transform={`rotate(${(i * 47) % 180} ${x} ${y})`}
          fill={cols[i % cols.length]}
        />
      ));
    }
    case 'grapes':
      return grid(8, 4, -20, 22, -36, 0).map(([x, y]) => (
        <g key={`${x},${y}`}>
          <circle cx={x} cy={y} r={3.4} fill={v.face} />
          <circle cx={x - 1.1} cy={y - 1.2} r={1} fill="#FFFFFF" opacity={0.8} />
        </g>
      ));
    case 'crosshatch':
      return (
        <path
          d={[-40, -30, -20, -10, 0, 10, 20, 30].map((k) => `M${k - 10},-44 l40,44 M${k + 30},-44 l-40,44`).join(' ')}
          stroke={v.dark}
          strokeWidth={1.5}
          opacity={0.35}
        />
      );
    case 'waves':
      return (
        <>
          <path d="M-26,-16 q6.5,-5 13,0 t13,0 t13,0 t13,0 V2 H-26 Z" fill={v.face} />
          <path d="M-26,-28 q6.5,-4 13,0 t13,0 t13,0 t13,0" stroke="#FFFFFF" strokeWidth={1.8} fill="none" opacity={0.6} />
        </>
      );
    case 'rope':
      return [-36, -28, -20, -12, -4].map((y) => (
        <path
          key={y}
          d={[-24, -18, -12, -6, 0, 6, 12, 18].map((x) => `M${x + (y % 8 ? 3 : 0)},${y} l4,6`).join(' ')}
          stroke={v.dark}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.45}
        />
      ));
    case 'fringe':
      return [-22, -17, -12, -7, -2, 3, 8, 13, 18, 23].map((x, i) => (
        <path key={x} d={`M${x},-42 q${i % 2 ? 3 : -3},10 0,20 t0,22`} stroke={v.mane as string} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      ));
    case 'darkspots':
      return (
        [
          [-12, -30, 3, 2],
          [6, -34, 2.4, 1.8],
          [14, -22, 3, 2.2],
          [-4, -20, 2.6, 1.8],
          [-16, -12, 2.4, 1.8],
          [8, -10, 3, 2],
          [-2, -6, 2, 1.5],
        ] as const
      ).map(([x, y, rx, ry]) => <ellipse key={`${x},${y}`} cx={x} cy={y} rx={rx} ry={ry} fill={v.dark} opacity={0.55} />);
    case 'barred':
      return [-20, -14, -8, -2].map((y) => <rect key={y} x={-26} y={y} width={52} height={2.6} fill="#F2F2F2" opacity={0.9} />);
    case 'grooves':
      return (
        <>
          <path d="M-26,-20 Q0,-27 26,-20 V2 H-26 Z" fill={v.face} />
          <path d={[-15, -9, -3, 3, 9, 15].map((x) => `M${x},-21 V0`).join(' ')} stroke={v.dark} strokeWidth={1.4} opacity={0.35} />
        </>
      );
    case 'swirl':
      return (
        [
          [-12, -26],
          [10, -14],
          [8, -34],
        ] as const
      ).map(([x, y]) => (
        <path
          key={`${x},${y}`}
          d={`M${x - 7},${y + 4} c2,-9 13,-9 12,-2 c-1,5 -8,4 -7,0 M${x + 5},${y + 2} q6,4 8,10`}
          stroke={v.mane as string}
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      ));
    case 'gold':
      return (
        <>
          <path d="M-24,-30 q8,-6 16,0 t16,0 t16,0 M-24,-12 q8,-6 16,0 t16,0 t16,0" stroke="#E8B83A" strokeWidth={2} fill="none" />
          {(
            [
              [-12, -22],
              [6, -22],
              [-2, -38],
              [16, -6],
              [-16, -4],
            ] as const
          ).map(([x, y]) => (
            <ellipse key={`${x},${y}`} cx={x} cy={y} rx={2.6} ry={1.8} fill="#DDF3F0" opacity={0.9} />
          ))}
        </>
      );
    case 'plaid':
      return <path d="M-14,-44 V2 M0,-44 V2 M14,-44 V2 M-26,-32 H26 M-26,-18 H26 M-26,-4 H26" stroke={v.dark} strokeWidth={3} opacity={0.25} />;
    case 'kasuri':
      return grid(10, 5, -20, 22, -34, 0).map(([x, y]) => (
        <path key={`${x},${y}`} d={`M${x - 3},${y} h6 M${x},${y - 3} v6`} stroke="#E8F0FF" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
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
    case 'rope':
      // Shimenawa, the sacred straw rope of a shrine, with zigzag paper streamers
      return (
        <>
          <path d="M-23,-74 Q0,-84 23,-74" stroke="#D9C089" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M-18,-76 l4,-3 M-9,-78.5 l4,-3 M0,-79.5 l4,-3 M9,-78.5 l4,-3" stroke="#9C7A3A" strokeWidth={1.6} />
          {[-10, 8].map((x) => (
            <path key={x} d={`M${x},-77 h5 l-3,4 h4 l-3,4 h4 l-3,4 h-4 l3,-4 h-4 l3,-4 h-3 Z`} fill="#FFFFFF" stroke="#9C968A" strokeWidth={1} />
          ))}
        </>
      );
    case 'shell':
      return (
        <>
          <path d="M-8,-80 C-12,-95 6,-105 15,-95 C21,-87 10,-78 -8,-80 Z" fill="#F2D7A6" stroke="#A97E3E" strokeWidth={2} />
          <path d="M11,-92 c-3,-4 -9,0 -6,4 c2,2 6,1 5,-2" stroke="#A97E3E" strokeWidth={1.6} fill="none" />
        </>
      );
    case 'hermit':
      // The shell itself sits behind the body (see BackHat); up front, a pair of raised claws
      return [-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * 22},-12) scale(${k * 1.25},1.25)`}>
          <path d="M0,0 c8,-2 12,-10 8,-16 l-3,5 l-4,-4 c-1,6 -4,10 -9,12 Z" fill={v.face} stroke={v.dark} strokeWidth={1.8} strokeLinejoin="round" />
        </g>
      ));
    case 'tugrope': {
      // The giant straw rope of the Naha tug-of-war, held across the belly
      // A point on the quadratic curve M-40,-20 Q0,-30 40,-18
      const pt = (t: number) => [f1(-40 + 80 * t), f1(-20 * (1 - t) ** 2 - 60 * t * (1 - t) - 18 * t * t)];
      return (
        <>
          <path d="M-40,-20 Q0,-30 40,-18" stroke="#8C6B3A" strokeWidth={12} fill="none" strokeLinecap="round" />
          <path d="M-40,-20 Q0,-30 40,-18" stroke="#E2C98C" strokeWidth={8} fill="none" strokeLinecap="round" />
          {Array.from({ length: 11 }, (_, i) => {
            const [x, y] = pt(0.04 + i * 0.092);
            return <path key={i} d={`M${x - 3},${y + 3.5} l6,-7`} stroke="#8C6B3A" strokeWidth={2} strokeLinecap="round" />;
          })}
          {[-1, 1].map((k) => (
            <g key={k}>
              <path
                d={`M${k * 42},${k < 0 ? -20 : -18} l${k * 7},-5 m${-k * 7},5 l${k * 8},0 m${-k * 8},0 l${k * 7},5`}
                stroke="#B09050"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <ellipse cx={k * 15} cy={-27} rx={7} ry={6} fill={v.face} stroke={v.dark} strokeWidth={2.2} />
              <path d={`M${k * 15 - 2.5},-23 v-3 M${k * 15 + 2.5},-23 v-3`} stroke={v.dark} strokeWidth={1.6} strokeLinecap="round" />
            </g>
          ))}
        </>
      );
    }
    case 'pearl':
      return (
        <>
          <circle cx={0} cy={-88} r={7.5} fill="#2B2638" stroke="#8C7FB0" strokeWidth={2} />
          <circle cx={-2.5} cy={-90.5} r={2.2} fill="#FFFFFF" opacity={0.85} />
        </>
      );
    case 'leaves':
      return (
        <path
          d="M-8,-80 L-16,-98 L-4,-86 L-4,-104 L1,-86 L8,-102 L6,-84 L16,-96 L8,-80 Z"
          fill="#4E9A3A"
          stroke="#2C5E1F"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case 'flag':
      return (
        <>
          <rect x={17} y={-110} width={3.5} height={44} rx={1.5} fill="#8C6B3A" />
          <circle cx={18.7} cy={-111} r={3.5} fill="#F2C43A" stroke="#A87C10" strokeWidth={1.2} />
          <path d="M20.5,-106 h16 v18 l-8,-4 l-8,4 Z" fill="#D9443A" stroke="#7A1E12" strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M20.5,-99 h16" stroke="#F2C43A" strokeWidth={2.5} />
        </>
      );
    case 'hanagasa':
      return (
        <>
          <ellipse cx={0} cy={-79} rx={24} ry={6} fill="#F2C43A" stroke="#A87C10" strokeWidth={2} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i} cx={f1(Math.cos(a) * 8)} cy={f1(-91 + Math.sin(a) * 7)} r={5.5} fill="#F25C7A" stroke="#A8304E" strokeWidth={1.2} />;
          })}
          <circle cx={0} cy={-91} r={4.5} fill="#FFD45E" />
        </>
      );
    case 'ears':
      return [-1, 1].map((k) => (
        <g key={k}>
          <path d={`M${k * 21},-70 L${k * 17},-90 L${k * 5},-79 Z`} fill={v.body} stroke={v.dark} strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={k * 15} cy={-80} r={2.4} fill="#FFFFFF" />
        </g>
      ));
    case 'claws':
      return [-1, 1].map((k) => (
        <path
          key={k}
          d={`M${k * 26},-58 c${k * 8},-4 ${k * 10},-16 ${k * 4},-24 l${-k * 3},7 l${k * 4},2 c${-k * 1},6 ${-k * 4},10 ${-k * 8},12 Z`}
          fill={v.face}
          stroke={v.dark}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      ));
    case 'antlers':
      // Kerama deer: a pair of branching antlers
      return [-1, 1].map((k) => (
        <path
          key={k}
          d={`M${k * 9},-84 C${k * 12},-94 ${k * 16},-100 ${k * 22},-108 M${k * 14},-97 l${k * 10},-3 M${k * 18},-103 l${-k * 2},-8`}
          stroke="#7A4A24"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      ));
    case 'lily':
      // A white trumpet lily tucked behind one ear
      return (
        <g transform="translate(22,-84) rotate(30)">
          <path d="M0,10 C-2,4 -1,-4 0,-8" stroke="#5E8A3A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <path
            d="M-3,-6 C-10,-14 -12,-22 -8,-26 C-4,-22 -2,-18 0,-14 C2,-18 4,-22 8,-26 C12,-22 10,-14 3,-6 Z"
            fill="#FFFFFF"
            stroke="#C9C2A8"
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <path d="M0,-14 V-24" stroke="#E8C43A" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      );
    case 'horns':
      // Water buffalo: wide horns sweeping out and back
      return [-1, 1].map((k) => (
        <path
          key={k}
          d={`M${k * 16},-80 C${k * 30},-90 ${k * 44},-84 ${k * 46},-70 C${k * 40},-78 ${k * 30},-80 ${k * 20},-74 Z`}
          fill="#D8CFC0"
          stroke="#6E6354"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      ));
    case 'cage':
      // Daito: the little cage a crane lifts people ashore in
      return (
        <g transform="translate(0,-97)">
          <path d="M0,-12 V-6" stroke="#6E6354" strokeWidth={2.5} strokeLinecap="round" />
          <rect x={-10} y={-6} width={20} height={14} rx={2} fill="none" stroke="#E2703A" strokeWidth={2.5} />
          <path d="M-5,-6 V8 M0,-6 V8 M5,-6 V8" stroke="#E2703A" strokeWidth={1.6} />
        </g>
      );
    case 'spout':
      return (
        <>
          <path
            d="M0,-80 C-2,-90 -8,-96 -15,-97 M0,-80 C2,-90 8,-96 15,-97 M0,-80 V-102"
            stroke="#7CC8F2"
            strokeWidth={3.2}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={-17} cy={-93} r={2.4} fill="#7CC8F2" />
          <circle cx={17} cy={-93} r={2.4} fill="#7CC8F2" />
        </>
      );
    default:
      return null;
  }
}

/** Things a shisa carries on its back, drawn before the body so they peek out from behind it */
function BackHat({ v }: { v: Variant }) {
  if (v.hat !== 'hermit') return null;
  return (
    <g transform="translate(-32,-35) rotate(-50) scale(.66)">
      <path d="M-24,8 C-30,-12 -12,-30 8,-27 C26,-24 32,-6 25,9 C18,23 -17,25 -24,8 Z" fill="#F2D7A6" stroke="#A97E3E" strokeWidth={2.5} />
      <path d="M8,-27 L14,-40 L19,-23 Z" fill="#E8C690" stroke="#A97E3E" strokeWidth={2.2} strokeLinejoin="round" />
      <path
        d="M13,-7 c-5,-10 -21,-8 -21,5 c0,11 15,13 21,5 c4,-6 -2,-12 -9,-9 c-4,2 -3,7 1,7"
        stroke="#A97E3E"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M-20,-8 q4,2 8,0 M-18,15 q4,-2 8,1 M18,14 q-3,-3 -7,-1" stroke="#D9A866" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Seconds between the blinks of each pair of lids: at least `min`, plus up to `spread`, picked once per shisa */
const BLINKS = [
  { id: 'a', min: 5, spread: 2 },
  { id: 'b', min: 8, spread: 3 },
];

/**
 * Eyelids the colour of the face, shut for a moment now and then. Each shisa has two pairs that blink at their own
 * pace, so its blinks never fall into a rhythm, and now and then come twice in a row (see `.lid` in app.css).
 */
function Lids({ face, dark }: { face: string; dark: string }) {
  const [paces] = useState(() =>
    BLINKS.map(({ id, min, spread }) => {
      const s = min + Math.random() * spread;
      return { id, style: { animationDuration: `${f1(s)}s`, animationDelay: `-${f1(Math.random() * s)}s` } };
    }),
  );
  return paces.map(({ id, style }) => (
    <g key={id} className="lid" style={style}>
      <circle cx={-8} cy={-59} r={6.5} fill={face} />
      <circle cx={8} cy={-59} r={6.5} fill={face} />
      <path d="M-13,-59 q5,3 10,0 M3,-59 q5,3 10,0" fill="none" stroke={dark} strokeWidth={2.6} strokeLinecap="round" />
    </g>
  ));
}

/**
 * A shisa standing with its feet at (0, 0), about 90 units tall.
 * open = the one that sets out (阿, open mouth); closed = the one waiting (吽).
 * sil = locked silhouette for collection slots not yet pulled.
 * smile = eyes curved up with joy, for when the two find each other.
 */
export function ShisaArt({ v, open, sil = false, smile = false }: { v: Variant; open: boolean; sil?: boolean; smile?: boolean }) {
  const id = useId();
  const body = sil ? '#BFCFCC' : v.body;
  const face = sil ? '#BFCFCC' : v.face;
  const dark = sil ? '#A2B4B1' : v.dark;
  const manes = sil ? ['#AFC1BE'] : Array.isArray(v.mane) ? v.mane : [v.mane];
  const hasPattern = !sil && v.pattern && v.pattern !== 'drum';
  return (
    <g transform="scale(.9)">
      <ellipse cx={0} cy={-2} rx={30} ry={6} fill="rgba(0,0,0,.16)" />
      {!sil && <BackHat v={v} />}
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
          {smile ? (
            <path data-smile d="M-13,-57 Q-8,-65 -3,-57 M3,-57 Q8,-65 13,-57" fill="none" stroke={dark} strokeWidth={3.2} strokeLinecap="round" />
          ) : (
            <>
              <circle cx={-8} cy={-59} r={5.5} fill="#fff" />
              <circle cx={8} cy={-59} r={5.5} fill="#fff" />
              <circle cx={-7} cy={-58.5} r={3} fill="#1d1d1d" />
              <circle cx={9} cy={-58.5} r={3} fill="#1d1d1d" />
              <Lids face={face} dark={dark} />
            </>
          )}
          <ellipse cx={0} cy={-51} rx={7} ry={4.5} fill={v.nose ?? dark} />
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
