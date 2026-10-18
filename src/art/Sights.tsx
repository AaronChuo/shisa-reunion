// Scenery for the roads a child picks between stops: the time of day (sky, sea and light) and a landmark on the far
// shore. Landmarks are drawn standing on a baseline at y = 0, about 240 units wide, so the board and the small cards
// on the branch choice can both place them.

export type TimeOfDay = 'day' | 'dusk' | 'night';
export type Sight = 'town' | 'palms' | 'bridge' | 'castle' | 'forest' | 'lighthouse' | 'field' | 'pier' | 'waterfall';

export interface Palette {
  skyTop: string;
  skyBottom: string;
  sea: string;
  seaDeep: string;
  wave: string;
  land: string;
  land2: string;
  cloud: string;
  /** Walls and other light surfaces */
  wall: string;
  roof: string;
  leaf: string;
  trunk: string;
  /** Lit windows; transparent by day */
  glow: string;
}

export const PALETTES: Record<TimeOfDay, Palette> = {
  day: {
    skyTop: '#93D2E8',
    skyBottom: '#E6F6F3',
    sea: '#3DB0C1',
    seaDeep: '#2B95A8',
    wave: '#A9E6EC',
    land: '#7DBE93',
    land2: '#94CEA6',
    cloud: '#FFFFFF',
    wall: '#F2EEE6',
    roof: '#CD4A31',
    leaf: '#4E9A5E',
    trunk: '#9C6B3E',
    glow: 'transparent',
  },
  dusk: {
    skyTop: '#F08A5D',
    skyBottom: '#FCE1B8',
    sea: '#D9826B',
    seaDeep: '#9A5E6E',
    wave: '#FBC9A4',
    land: '#8C7A5A',
    land2: '#A08A62',
    cloud: '#FFD9C2',
    wall: '#E8C9A8',
    roof: '#B5523A',
    leaf: '#5F7A45',
    trunk: '#7A5236',
    glow: '#FFD45E',
  },
  night: {
    skyTop: '#16224A',
    skyBottom: '#3A4D80',
    sea: '#1F4A6E',
    seaDeep: '#163652',
    wave: '#5E86B5',
    land: '#2D4A45',
    land2: '#365850',
    cloud: '#56688F',
    wall: '#4A5578',
    roof: '#6E3A48',
    leaf: '#2C5243',
    trunk: '#3D3A48',
    glow: '#FFD45E',
  },
};

/** A sun, a low setting sun, or a moon with stars, for a sky `W` wide whose horizon is at `hy` */
export function SkyLight({ time, W, hy, s = 1 }: { time: TimeOfDay; W: number; hy: number; s?: number }) {
  if (time === 'dusk') {
    return (
      <g>
        <circle cx={W * 0.72} cy={hy - 8 * s} r={62 * s} fill="#FFB36B" opacity={0.45} />
        <circle cx={W * 0.72} cy={hy - 8 * s} r={40 * s} fill="#FF8A4C" />
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
          <circle key={i} cx={W * fx} cy={hy * fy} r={(i % 3 === 0 ? 3.4 : 2.2) * s} fill="#FFF6D8" opacity={0.9} />
        ))}
        <circle cx={W * 0.82} cy={hy * 0.22} r={30 * s} fill="#FFF3C4" />
        <circle cx={W * 0.82 + 12 * s} cy={hy * 0.22 - 7 * s} r={26 * s} fill={PALETTES.night.skyTop} />
      </g>
    );
  }
  return (
    <g>
      <circle cx={W * 0.82} cy={hy * 0.2} r={50 * s} fill="#FFF4C9" opacity={0.75} />
      <circle cx={W * 0.82} cy={hy * 0.2} r={32 * s} fill="#FFD45E" />
    </g>
  );
}

function House({ x, w, h, P }: { x: number; w: number; h: number; P: Palette }) {
  return (
    <g>
      <rect x={x} y={-h} width={w} height={h} fill={P.wall} />
      <path d={`M${x - 6},${-h} L${x + w * 0.2},${-h - 18} L${x + w * 0.8},${-h - 18} L${x + w + 6},${-h} Z`} fill={P.roof} />
      <rect x={x + w * 0.3} y={-h * 0.62} width={w * 0.4} height={h * 0.34} fill={P.glow === 'transparent' ? '#8FB8C9' : P.glow} />
    </g>
  );
}

function Palm({ x, h, lean, P }: { x: number; h: number; lean: number; P: Palette }) {
  const tx = x + lean;
  return (
    <g>
      <path d={`M${x},0 Q${x + lean * 0.2},${-h * 0.6} ${tx},${-h}`} stroke={P.trunk} strokeWidth={7} fill="none" strokeLinecap="round" />
      {[-1, 1].map((k) => (
        <g key={k}>
          <path d={`M${tx},${-h} q${k * 24},-14 ${k * 44},4`} stroke={P.leaf} strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d={`M${tx},${-h} q${k * 16},-26 ${k * 34},-26`} stroke={P.leaf} strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

/** A landmark standing on y = 0, about 240 wide */
export function SightArt({ sight, time }: { sight: Sight; time: TimeOfDay }) {
  const P = PALETTES[time];
  const night = time === 'night';
  switch (sight) {
    case 'town':
      return (
        <g>
          <path d="M-10,0 Q120,-22 250,0 Z" fill={P.land} />
          <House x={10} w={44} h={34} P={P} />
          <House x={66} w={56} h={46} P={P} />
          <House x={134} w={40} h={30} P={P} />
          <House x={184} w={46} h={40} P={P} />
        </g>
      );
    case 'palms':
      return (
        <g>
          <path d="M0,0 Q120,-26 240,0 Z" fill={night ? '#5B6A7E' : time === 'dusk' ? '#E5C08F' : '#F3E3B5'} />
          <Palm x={50} h={110} lean={-14} P={P} />
          <Palm x={120} h={136} lean={10} P={P} />
          <Palm x={186} h={96} lean={18} P={P} />
        </g>
      );
    case 'bridge':
      return (
        <g>
          <path d="M-20,0 Q10,-30 40,-30 H200 Q230,-30 260,0 Z" fill="none" />
          <rect x={-10} y={-34} width={260} height={9} rx={3} fill={P.wall} />
          {[20, 70, 120, 170, 220].map((x) => (
            <rect key={x} x={x - 4} y={-26} width={8} height={26} fill={P.wall} opacity={0.9} />
          ))}
          {night && [0, 40, 80, 120, 160, 200, 240].map((x) => <circle key={x} cx={x} cy={-40} r={3} fill={P.glow} />)}
        </g>
      );
    case 'castle':
      return (
        <g>
          <path d="M0,0 C0,-40 20,-58 60,-60 H180 C220,-58 240,-40 240,0 Z" fill={night ? '#8C7F6B' : '#D8CFC0'} />
          <path d="M14,-20 H226 M24,-40 H216" stroke={night ? '#6E6354' : '#B7AC97'} strokeWidth={2} />
          <rect x={80} y={-100} width={80} height={40} fill={P.roof} />
          <path d="M66,-100 L88,-124 H152 L174,-100 Z" fill={P.roof} stroke={night ? '#3D2229' : '#86281A'} strokeWidth={2} />
          {night && <rect x={80} y={-100} width={80} height={40} fill="#FFD45E" opacity={0.35} />}
        </g>
      );
    case 'forest':
      return (
        <g>
          {[
            [30, -40, 40],
            [80, -62, 50],
            [140, -54, 48],
            [196, -38, 40],
            [110, -30, 36],
          ].map(([x, y, r]) => (
            <circle key={`${x}`} cx={x} cy={y} r={r} fill={P.leaf} />
          ))}
          <path d="M20,0 l8,-18 M44,0 l-6,-16 M150,0 l6,-18 M176,0 l-8,-16" stroke={P.trunk} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'lighthouse':
      return (
        <g>
          <path d="M0,0 C30,-40 90,-56 150,-56 C200,-56 230,-30 240,0 Z" fill={P.land} />
          <path d="M108,-56 L114,-150 H134 L140,-56 Z" fill={night ? '#C9CEDB' : '#FFFFFF'} />
          <rect x={110} y={-166} width={28} height={16} fill={P.roof} />
          {night && <path d="M124,-158 L-10,-200 L-10,-130 Z" fill="#FFF3C4" opacity={0.25} />}
        </g>
      );
    case 'field':
      return (
        <g>
          <path d="M0,0 Q120,-30 240,0 Z" fill={P.land} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${16 + i * 30},-6 q10,-14 20,0 q10,-14 20,0`}
              stroke={night ? '#5E4A70' : '#8C56AA'}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
          ))}
          <House x={180} w={44} h={32} P={P} />
        </g>
      );
    case 'pier':
      return (
        <g>
          <path d="M-10,0 Q30,-16 70,0 Z" fill={P.land} />
          <rect x={40} y={-14} width={200} height={7} fill={night ? '#9AA3B8' : '#E8E1D2'} />
          {[60, 100, 140, 180, 220].map((x) => (
            <rect key={x} x={x} y={-8} width={5} height={10} fill={night ? '#7A8399' : '#BDB3A0'} />
          ))}
        </g>
      );
    case 'waterfall':
      return (
        <g>
          <path d="M0,0 V-90 C40,-120 90,-128 120,-120 C170,-128 220,-110 240,-80 V0 Z" fill={P.leaf} />
          <path d="M100,-118 C104,-80 98,-40 102,0 H138 C134,-40 140,-80 136,-118 Z" fill={night ? '#8FA6C9' : '#E6F6FA'} />
          <path d="M112,-110 V-4 M126,-112 V-6" stroke={night ? '#B9C8E0' : '#FFFFFF'} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
  }
}

/** A small picture of a road: its sky, sea and landmark, for the branch cards */
export function RoadScene({ time, sight, className }: { time: TimeOfDay; sight: Sight; className?: string }) {
  const P = PALETTES[time];
  const id = `rs-${time}-${sight}`;
  return (
    <svg className={className} viewBox="0 0 200 120" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.skyTop} />
          <stop offset="1" stopColor={P.skyBottom} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <rect width={200} height={120} rx={12} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect width={200} height={120} fill={`url(#${id})`} />
        <SkyLight time={time} W={200} hy={92} s={0.45} />
        <g transform="translate(46,93) scale(0.45)">
          <SightArt sight={sight} time={time} />
        </g>
        <rect y={92} width={200} height={28} fill={P.sea} />
      </g>
    </svg>
  );
}
