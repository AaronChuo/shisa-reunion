import { useId } from 'react';

// The house of 西薩的家, in house units (360 × 450): the red tile roof from the title screen grown into a whole house,
// with sliding doors, a stone step, fukugi trees either side and a sandy yard in front. The pair stands on the ridge at
// y 228; the picture behind it covers the top 72%, down to where the grass starts.

/** Rows of white plaster arcs along the roof tiles, as on the title screen */
const tiles = (y: number, from: number, n: number) => `M${from},${y}${' a10,8 0 0 0 20,0'.repeat(n)}`;

export function HouseArt() {
  return (
    <svg className="hHouse" viewBox="0 0 360 450" aria-hidden="true">
      {/* Fukugi trees, the windbreak planted around Okinawan houses */}
      <rect x={22} y={250} width={10} height={80} fill="#6B4A2B" />
      <rect x={328} y={250} width={10} height={80} fill="#6B4A2B" />
      <g fill="#3E7F4C" stroke="#2A5B36" strokeWidth={3}>
        <ellipse cx={27} cy={238} rx={38} ry={48} />
        <ellipse cx={333} cy={238} rx={38} ry={48} />
      </g>
      <g fill="#4F9A5A">
        <ellipse cx={18} cy={222} rx={16} ry={20} />
        <ellipse cx={342} cy={222} rx={16} ry={20} />
      </g>
      {/* The yard: grass along the house, sand in front, stepping stones to the door */}
      <rect x={0} y={318} width={360} height={132} fill="#EBDDB5" />
      <path d="M0,320 H360" stroke="#8CC27A" strokeWidth={10} />
      <g fill="#D8CBA6" stroke="#B9A97F" strokeWidth={2}>
        <ellipse cx={180} cy={384} rx={18} ry={7} />
        <ellipse cx={174} cy={408} rx={20} ry={8} />
        <ellipse cx={184} cy={434} rx={22} ry={9} />
      </g>
      {/* The stone step, the wall and four paper sliding doors */}
      <rect x={64} y={350} width={232} height={14} rx={3} fill="#D9CCAA" stroke="#A8977A" strokeWidth={2} />
      <rect x={74} y={288} width={212} height={64} fill="#8A5A33" />
      <g fill="#F6EEDA" stroke="#8A5A33" strokeWidth={2}>
        <rect x={86} y={300} width={42} height={50} />
        <rect x={138} y={300} width={38} height={50} />
        <rect x={186} y={300} width={38} height={50} />
        <rect x={234} y={300} width={40} height={50} />
      </g>
      <path
        d="M86,317 H128 M86,334 H128 M107,300 V350 M138,317 H176 M138,334 H176 M157,300 V350 M186,317 H224 M186,334 H224 M205,300 V350 M234,317 H274 M234,334 H274 M254,300 V350"
        stroke="#C9B48E"
        strokeWidth={1.5}
      />
      <rect x={74} y={288} width={212} height={10} fill="#6E4528" />
      <g fill="#6E4528">
        <rect x={76} y={290} width={8} height={62} />
        <rect x={129} y={290} width={8} height={62} />
        <rect x={177} y={290} width={8} height={62} />
        <rect x={225} y={290} width={8} height={62} />
        <rect x={276} y={290} width={8} height={62} />
      </g>
      {/* The red tile roof, its white plaster ridge and eaves */}
      <path d="M40,294 L104,228 L256,228 L320,294 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={4} strokeLinejoin="round" />
      <path d={tiles(252, 86, 9)} fill="none" stroke="#F7E2C7" strokeWidth={3} opacity={0.85} />
      <path d={tiles(274, 70, 11)} fill="none" stroke="#F7E2C7" strokeWidth={3} opacity={0.85} />
      <rect x={98} y={220} width={164} height={12} rx={6} fill="#F2EEE6" stroke="#86281A" strokeWidth={3} />
      <rect x={36} y={290} width={288} height={9} rx={4} fill="#F7E2C7" stroke="#86281A" strokeWidth={2.5} />
    </svg>
  );
}

/** The plain picture behind the house before any zone has been visited: sky, a sun, clouds and the sea */
export function SkyArt({ className = 'hBd' }: { className?: string }) {
  const id = useId();
  return (
    <svg className={className} viewBox="0 0 360 324" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6CCBEF" />
          <stop offset="1" stopColor="#CDEFF6" />
        </linearGradient>
      </defs>
      <rect width={360} height={324} fill={`url(#sky${id})`} />
      <circle cx={300} cy={58} r={26} fill="#FFE27A" />
      <circle cx={300} cy={58} r={36} fill="#FFE27A" opacity={0.25} />
      <g fill="#fff">
        <ellipse cx={70} cy={70} rx={34} ry={12} />
        <ellipse cx={92} cy={60} rx={22} ry={14} />
        <ellipse cx={210} cy={112} rx={30} ry={10} />
        <ellipse cx={228} cy={104} rx={18} ry={11} />
      </g>
      <rect y={258} width={360} height={66} fill="#36B0D6" />
      <path d="M0,262 H360" stroke="#E8FAFD" strokeWidth={3} opacity={0.8} />
    </svg>
  );
}
