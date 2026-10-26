import { useId } from 'react';
import { sceneUrl } from '../content/zones';
import type { Gate } from '../engine';
import { boardWidth, C, M, Y0 } from '../game/geometry';

export type TimeOfDay = 'day' | 'dusk' | 'night';

/** Colours of the drawn sky and sea that show until the painting has loaded */
const PALETTES: Record<
  TimeOfDay,
  { skyTop: string; skyBottom: string; sea: string; seaDeep: string; wave: string; land: string; land2: string; cloud: string }
> = {
  day: { skyTop: '#93D2E8', skyBottom: '#E6F6F3', sea: '#3DB0C1', seaDeep: '#2B95A8', wave: '#A9E6EC', land: '#7DBE93', land2: '#94CEA6', cloud: '#FFFFFF' },
  dusk: { skyTop: '#F08A5D', skyBottom: '#FCE1B8', sea: '#D9826B', seaDeep: '#9A5E6E', wave: '#FBC9A4', land: '#8C7A5A', land2: '#A08A62', cloud: '#FFD9C2' },
  night: { skyTop: '#16224A', skyBottom: '#3A4D80', sea: '#1F4A6E', seaDeep: '#163652', wave: '#5E86B5', land: '#2D4A45', land2: '#365850', cloud: '#56688F' },
};

const f1 = (v: number) => +v.toFixed(1);

export function Sun({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i * Math.PI) / 4;
        return (
          <path
            key={i}
            d={`M${f1(cx + Math.cos(a) * r * 1.35)},${f1(cy + Math.sin(a) * r * 1.35)} L${f1(cx + Math.cos(a) * r * 1.9)},${f1(cy + Math.sin(a) * r * 1.9)}`}
            stroke={color}
            strokeWidth={f1(r * 0.4)}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function Cloud({ x, y, s, fill = '#fff' }: { x: number; y: number; s: number; fill?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} opacity={0.92}>
      <circle r={26} />
      <circle cx={30} cy={-12} r={32} />
      <circle cx={64} r={24} />
      <rect x={-10} width={84} height={22} rx={11} />
    </g>
  );
}

/** A sun, a low setting sun, or a moon with stars, for a sky `W` wide whose horizon is at `hy` */
function SkyLight({ time, W, hy }: { time: TimeOfDay; W: number; hy: number }) {
  if (time === 'dusk') {
    return (
      <g>
        <circle cx={W * 0.72} cy={hy - 8} r={62} fill="#FFB36B" opacity={0.45} />
        <circle cx={W * 0.72} cy={hy - 8} r={40} fill="#FF8A4C" />
      </g>
    );
  }
  if (time === 'night') {
    const stars = [
      [0.08, 0.2],
      [0.18, 0.42],
      [0.3, 0.16],
      [0.42, 0.34],
      [0.55, 0.12],
      [0.63, 0.4],
      [0.9, 0.3],
      [0.24, 0.6],
      [0.5, 0.55],
    ];
    return (
      <g>
        {stars.map(([fx, fy], i) => (
          <circle key={i} cx={W * fx} cy={hy * fy} r={i % 3 === 0 ? 3.4 : 2.2} fill="#FFF6D8" opacity={0.9} />
        ))}
        <circle cx={W * 0.82} cy={hy * 0.22} r={30} fill="#FFF3C4" />
        <circle cx={W * 0.82 + 12} cy={hy * 0.22 - 7} r={26} fill={PALETTES.night.skyTop} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={W * 0.82} cy={hy * 0.2} r={50} fill="#FFF4C9" opacity={0.75} />
      <circle cx={W * 0.82} cy={hy * 0.2} r={32} fill="#FFD45E" />
    </g>
  );
}

/**
 * The zone's painting for the time of day behind the board, cut to the board's width. A drawn sky, sun or moon,
 * islands and sea sit underneath, so the board never stands on nothing while the painting loads.
 */
export function Background({ w, zone, time }: { w: number; zone: string; time: TimeOfDay }) {
  const id = useId();
  const W2 = boardWidth(w);
  const P = PALETTES[time];
  return (
    <>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.skyTop} />
          <stop offset=".8" stopColor={P.skyBottom} />
        </linearGradient>
        <clipPath id={`clip${id}`}>
          <rect x={0} y={30} width={W2} height={690} rx={26} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip${id})`} data-time={time}>
        <rect x={0} y={30} width={W2} height={690} fill={`url(#sky${id})`} />
        <SkyLight time={time} W={W2} hy={604} />
        {time !== 'night' && (
          <>
            <Cloud x={110} y={132} s={1} fill={P.cloud} />
            <Cloud x={W2 * 0.57} y={92} s={0.75} fill={P.cloud} />
          </>
        )}
        <path d="M0,604 C70,572 150,566 230,586 C262,594 284,600 304,604 Z" fill={P.land} />
        <path d={`M${W2 - 180},604 c24,-16 64,-20 96,-9 c22,7 46,9 84,9 Z`} fill={P.land2} />
        <rect x={0} y={602} width={W2} height={118} fill={P.sea} />
        <path
          d={`M20,624 q15,-8 30,0 t30,0 M${W2 * 0.45},624 q15,-8 30,0 t30,0 M${W2 - 140},620 q15,-8 30,0 t30,0`}
          stroke={P.wave}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <rect x={0} y={690} width={W2} height={30} fill={P.seaDeep} />
        <image href={sceneUrl(zone, time)} x={0} y={30} width={W2} height={690} preserveAspectRatio="xMidYMid slice" />
      </g>
    </>
  );
}

/** The wooden tray the blocks stand on, with dashed column guides */
export function TrayBase({ w }: { w: number }) {
  return (
    <>
      <rect x={M - 18} y={Y0} width={w * C + 36} height={48} rx={14} fill="#CFA471" stroke="#8E6435" strokeWidth={4} />
      <rect x={M - 12} y={Y0 + 5} width={w * C + 24} height={8} rx={4} fill="#E8CB9C" />
      {Array.from({ length: w }, (_, x) => (
        <rect key={`slot${x}`} x={M + x * C + 28} y={Y0 + 22} width={44} height={11} rx={5.5} fill="#8E6435" opacity={0.28} />
      ))}
      {Array.from({ length: w - 1 }, (_, i) => (
        <path
          key={`guide${i}`}
          d={`M${M + (i + 1) * C},${Y0 - 6} V${Y0 - 500}`}
          stroke="#fff"
          strokeOpacity={0.6}
          strokeWidth={2}
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

export function Urchin({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <path
            key={i}
            d={`M${f1(cx + Math.cos(a) * 10)},${f1(cy + Math.sin(a) * 10)} L${f1(cx + Math.cos(a) * 23)},${f1(cy + Math.sin(a) * 23)}`}
            stroke="#3B2450"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={14} fill="#5B3A7A" stroke="#3B2450" strokeWidth={2.5} />
      <circle cx={cx - 5} cy={cy - 2} r={3.2} fill="#fff" />
      <circle cx={cx + 5} cy={cy - 2} r={3.2} fill="#fff" />
      <circle cx={cx - 4.5} cy={cy - 1.5} r={1.6} fill="#1d1d1d" />
      <circle cx={cx + 5.5} cy={cy - 1.5} r={1.6} fill="#1d1d1d" />
    </g>
  );
}

/** A little heap of star sand standing on the ground at (cx, cy); it fades out once picked up */
export function StarSand({ cx, cy, taken }: { cx: number; cy: number; taken?: boolean }) {
  const star = (x: number, y: number, r: number) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      d += `${i ? 'L' : 'M'}${f1(x + Math.cos(a) * rr)},${f1(y + Math.sin(a) * rr)} `;
    }
    return `${d}Z`;
  };
  return (
    <g className={taken ? 'starSand taken' : 'starSand'}>
      <ellipse cx={cx} cy={cy - 4} rx={26} ry={9} fill="#FFF3C9" stroke="#D9B45A" strokeWidth={2} />
      {(
        [
          [-12, -10, 7],
          [4, -14, 8],
          [16, -8, 6],
          [-2, -4, 5],
          [-20, -3, 4.5],
        ] as const
      ).map(([dx, dy, r]) => (
        <path key={`${dx},${dy}`} d={star(cx + dx, cy + dy, r)} fill="#FFE07A" stroke="#C98F1E" strokeWidth={1.5} strokeLinejoin="round" />
      ))}
      <path className="starGlint" d={`M${cx + 20},${cy - 34} v12 M${cx + 14},${cy - 28} h12`} stroke="#FFD45E" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

export function Plate({ px, on }: { px: number; on: boolean }) {
  const cx = M + px * C + 50;
  return (
    <g>
      <rect x={cx - 36} y={Y0 - 8} width={72} height={14} rx={6} fill={on ? '#FFE08A' : '#CFC3AF'} stroke={on ? '#C8961E' : '#8E8270'} strokeWidth={3} />
      <Sun cx={cx} cy={Y0 - 1} r={4} color={on ? '#E8A21E' : '#9C907C'} />
      {!on && (
        <rect className="ghostLine" x={cx - 42} y={Y0 - 14} width={84} height={26} rx={10} fill="none" stroke="#E8A21E" strokeWidth={3} strokeDasharray="8 6" />
      )}
    </g>
  );
}

/** Stone gate with a sloped red-tile roof (so nothing can rest on it) */
export function GateArt({ gate, open }: { gate: Pick<Gate, 'x' | 'h'>; open: boolean }) {
  const x0 = M + gate.x * C;
  const top = Y0 - gate.h * C;
  const hh = gate.h * C;
  const dy = top + 21;
  const dh = Y0 - dy;
  const studs: number[] = [];
  for (let y = dy + 16; y < Y0 - 8; y += 22) studs.push(y);
  return (
    <g>
      <path
        d={`M${x0 - 6},${top + 10} L${x0 + 12},${top - 14} L${x0 + 88},${top - 14} L${x0 + 106},${top + 10} Z`}
        fill="#CD4A31"
        stroke="#86281A"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d={`M${x0 + 6},${top + 2} H${x0 + 94} M${x0 + 14},${top - 6} H${x0 + 86}`} stroke="#F7E2C7" strokeWidth={2.5} opacity={0.8} />
      <rect x={x0 + 4} y={top + 10} width={14} height={hh - 10} fill="#D9CFBD" stroke="#8C7F6B" strokeWidth={3} />
      <rect x={x0 + 82} y={top + 10} width={14} height={hh - 10} fill="#D9CFBD" stroke="#8C7F6B" strokeWidth={3} />
      <rect x={x0 + 2} y={top + 8} width={96} height={13} fill="#C23A2B" stroke="#7A1E12" strokeWidth={3} />
      {open ? (
        <>
          <rect x={x0 + 18} y={dy} width={64} height={dh} fill="#2B1B17" opacity={0.22} />
          <rect x={x0 + 18} y={dy} width={8} height={dh} fill="#B8332A" stroke="#6E1A13" strokeWidth={2} />
          <rect x={x0 + 74} y={dy} width={8} height={dh} fill="#B8332A" stroke="#6E1A13" strokeWidth={2} />
        </>
      ) : (
        <>
          <rect x={x0 + 18} y={dy} width={32} height={dh} fill="#B8332A" stroke="#6E1A13" strokeWidth={2.5} />
          <rect x={x0 + 50} y={dy} width={32} height={dh} fill="#B8332A" stroke="#6E1A13" strokeWidth={2.5} />
          {studs.map((y) => (
            <g key={y}>
              <circle cx={x0 + 30} cy={y} r={2.6} fill="#F2B233" />
              <circle cx={x0 + 70} cy={y} r={2.6} fill="#F2B233" />
            </g>
          ))}
          <Sun cx={x0 + 50} cy={dy + dh / 2} r={7} color="#FFD45E" />
        </>
      )}
    </g>
  );
}

export function Water({ w, level, rise }: { w: number; level: number; rise: boolean }) {
  const top = Y0 - level * C + 22;
  const x1 = boardWidth(w);
  let d = `M0,${top}`;
  for (let x = 0; x < x1; x += 50) d += ' q12.5,-8 25,0 t25,0';
  return (
    <g className={rise ? 'rise' : undefined} pointerEvents="none">
      <path d={`${d} V720 H0 Z`} fill="#2EA6BE" fillOpacity={0.45} />
      <path d={d} fill="none" stroke="#DDF7FA" strokeWidth={3} opacity={0.9} />
    </g>
  );
}
