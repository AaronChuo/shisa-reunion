import type { ReactNode } from 'react';
import { ShisaArt } from '../art/Shisa';
import { type Series, VARIANTS } from '../content/shisa';

// Each gacha machine wears a roof in its own theme, with that series' rare shisa sitting on top as the prize.
// Everything is drawn in the machine's units, between y = -12 and the eave at y = 72–86 above the dome.

const f1 = (v: number) => +v.toFixed(1);

function Prize({ series, x = 155, y = 34 }: { series: Series['id']; x?: number; y?: number }) {
  const v = VARIANTS.find((x) => x.series === series && x.rare) ?? VARIANTS[0];
  return (
    <g transform={`translate(${x},${y}) scale(.42)`}>
      <ShisaArt v={v} open />
    </g>
  );
}

/** 傳統: red tiles held with white plaster, like the roofs shisa sit on */
function Tiles() {
  return (
    <>
      <path d="M40,74 L74,30 L236,30 L270,74 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={4} strokeLinejoin="round" />
      {[44, 58].map((y) => (
        <path key={y} d={`M${f1(74 - (y - 30) * 0.77)},${y}${' a8,7 0 0 0 16,0'.repeat(y === 44 ? 10 : 12)}`} fill="none" stroke="#F7E2C7" strokeWidth={3} />
      ))}
      <rect x={70} y={25} width={170} height={9} rx={4.5} fill="#F2EEE6" stroke="#86281A" strokeWidth={2.5} />
      <Prize series="trad" y={28} />
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#F7E2C7" stroke="#86281A" strokeWidth={3} />
    </>
  );
}

/** 海洋: a curling wave with foam, little fish, and seaweed trailing down the sides */
function Wave() {
  return (
    <>
      {[50, 260].map((x) => (
        <path key={x} d={`M${x},80 q-8,14 0,28 t0,28`} stroke="#3E9B6E" strokeWidth={6} fill="none" strokeLinecap="round" />
      ))}
      <path
        d="M38,78 C36,48 64,34 92,44 C104,26 136,20 155,36 C174,20 206,26 218,44 C246,34 274,48 272,78 Z"
        fill="#2D8FD0"
        stroke="#1B4B7E"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M52,58 c10,-14 26,-14 34,-4 M104,40 c10,-12 30,-12 38,0 M170,40 c10,-12 30,-12 38,0 M226,54 c8,-12 24,-12 32,0"
        stroke="#fff"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      {[
        [80, 64, 1],
        [228, 66, -1],
      ].map(([x, y, k]) => (
        <g key={x} transform={`translate(${x},${y}) scale(${k},1)`}>
          <path d="M-9,0 C-4,-7 6,-7 10,0 C6,7 -4,7 -9,0 Z M-9,0 L-16,-5 L-15,5 Z" fill="#F7C843" stroke="#B5531A" strokeWidth={1.5} />
          <circle cx={5} cy={-1} r={1.4} fill="#173944" />
        </g>
      ))}
      <Prize series="sea" y={36} />
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#F1E0B5" stroke="#B08A4E" strokeWidth={3} />
      {[70, 120, 190, 240].map((x) => (
        <circle key={x} cx={x} cy={79} r={3} fill="#fff" stroke="#C9A26A" strokeWidth={1.2} />
      ))}
    </>
  );
}

/** 美食: a big bowl of Okinawa soba, steaming, with the prize shisa sitting in it */
function SobaBowl() {
  return (
    <>
      {[118, 155, 192].map((x, i) => (
        <path
          key={x}
          className="steam"
          style={{ animationDelay: `${i * 0.5}s` }}
          d={`M${x},14 q-7,-8 0,-16 t0,-16`}
          stroke="#fff"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <ellipse cx={155} cy={30} rx={116} ry={13} fill="#C98A3E" stroke="#7A4A1E" strokeWidth={3} />
      {/* Noodles, a slice of pork belly, fish cake and green onion floating in the broth */}
      <path d="M70,30 q8,-6 16,0 t16,0 t16,0 M196,32 q8,-6 16,0 t16,0" stroke="#F6E3A8" strokeWidth={3} fill="none" strokeLinecap="round" />
      <rect x={84} y={21} width={26} height={12} rx={3} fill="#9C5B2E" stroke="#5A3010" strokeWidth={1.5} />
      <path d="M86,25 H108 M86,29 H108" stroke="#F3DDB6" strokeWidth={1.5} />
      <ellipse cx={214} cy={27} rx={10} ry={5} fill="#FFC7D6" stroke="#C2607C" strokeWidth={1.5} />
      {[
        [178, 34],
        [190, 27],
        [126, 35],
        [140, 25],
      ].map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r={2.6} fill="#5FAE4B" />
      ))}
      <Prize series="food" x={155} y={38} />
      {/* The bowl's front, white with a cobalt band like Tsuboya pottery, hides the shisa's feet */}
      <path
        d="M38,32 C42,62 84,78 155,78 C226,78 268,62 272,32 C250,42 206,46 155,46 C104,46 60,42 38,32 Z"
        fill="#fff"
        stroke="#3E6E9C"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M58,54 q12,-8 24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0" stroke="#3E6E9C" strokeWidth={3} fill="none" />
      <path d="M232,-6 L196,40 M246,-2 L206,42" stroke="#B5803F" strokeWidth={4} strokeLinecap="round" />
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#B5803F" stroke="#6E4A1E" strokeWidth={3} />
    </>
  );
}

/** 祭典: a festival stage roof in red and white, flags at the corners and lanterns strung under the eave */
function Festival() {
  const stripes: ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const x0 = 40 + (i * 230) / 12;
    const x1 = 40 + ((i + 1) * 230) / 12;
    const t0 = 70 + ((x0 - 40) * 170) / 230;
    const t1 = 70 + ((x1 - 40) * 170) / 230;
    stripes.push(<path key={i} d={`M${f1(x0)},74 L${f1(t0)},34 L${f1(t1)},34 L${f1(x1)},74 Z`} fill={i % 2 ? '#fff' : '#D9443A'} />);
  }
  return (
    <>
      {[60, 250].map((x, i) => (
        <g key={x}>
          <path d={`M${x},74 V4`} stroke="#8C6B3A" strokeWidth={4} />
          <circle cx={x} cy={2} r={5} fill="#F2C43A" stroke="#A87C10" strokeWidth={1.5} />
          <path
            d={`M${x},8 h${i ? -22 : 22} v20 l${i ? 11 : -11},-6 l${i ? 11 : -11},6 Z`}
            fill={i ? '#2D8FD0' : '#F2C43A'}
            stroke="#173944"
            strokeWidth={1.5}
          />
        </g>
      ))}
      {stripes}
      <path d="M40,74 L70,34 L240,34 L270,74 Z" fill="none" stroke="#7A1E12" strokeWidth={4} strokeLinejoin="round" />
      <Prize series="fest" y={34} />
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#F2C43A" stroke="#A87C10" strokeWidth={3} />
      <path d="M50,86 Q155,104 260,86" stroke="#173944" strokeWidth={1.5} fill="none" />
      {[78, 116, 155, 194, 232].map((x, i) => {
        const y = 86 + 18 * (1 - ((x - 155) / 105) ** 2) - 2;
        return (
          <g key={x} transform={`translate(${x},${f1(y)})`}>
            <ellipse cx={0} cy={8} rx={7} ry={9} fill={i % 2 ? '#F2C43A' : '#D9443A'} stroke="#7A1E12" strokeWidth={1.5} />
            <rect x={-4} y={-2} width={8} height={3} fill="#173944" />
            <rect x={-4} y={16} width={8} height={3} fill="#173944" />
          </g>
        );
      })}
    </>
  );
}

/** 動物: a leafy forest canopy with hibiscus and vines, where the wild cat keeps watch */
function Canopy() {
  const leaves: [number, number, number, string][] = [
    [56, 62, 20, '#3E8F4A'],
    [84, 46, 24, '#4FA857'],
    [118, 36, 26, '#3E8F4A'],
    [155, 30, 26, '#5DBB62'],
    [192, 36, 26, '#3E8F4A'],
    [226, 46, 24, '#4FA857'],
    [254, 62, 20, '#3E8F4A'],
    [100, 64, 22, '#5DBB62'],
    [155, 62, 24, '#4FA857'],
    [210, 64, 22, '#5DBB62'],
  ];
  return (
    <>
      {[52, 258].map((x) => (
        <path key={x} d={`M${x},76 q6,16 0,30 t0,30`} stroke="#2F6B2A" strokeWidth={4} fill="none" strokeLinecap="round" />
      ))}
      {leaves.map(([x, y, r, c]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r={r} fill={c} stroke="#23461F" strokeWidth={2.5} />
      ))}
      {[
        [80, 52],
        [232, 56],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x},${y})`}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = ((i * 72 - 90) * Math.PI) / 180;
            return <circle key={i} cx={f1(Math.cos(a) * 5)} cy={f1(Math.sin(a) * 5)} r={4.2} fill="#E2513C" />;
          })}
          <circle r={2.4} fill="#FFD45E" />
        </g>
      ))}
      <Prize series="animal" y={24} />
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#8A5A2B" stroke="#5A3A1A" strokeWidth={3} />
    </>
  );
}

/** 工藝: a cobalt-glazed roof woven with the minsa pattern, a pottery jar at each corner */
function Craft() {
  const squares: ReactNode[] = [];
  // Minsa: rows of five and four squares, "for ever and ever"
  for (const [y, n] of [
    [44, 5],
    [56, 4],
  ] as const) {
    for (let i = 0; i < n; i++) {
      for (const cx of [100, 210]) {
        const x = cx + (i - (n - 1) / 2) * 9;
        squares.push(<rect key={`${cx},${y},${i}`} x={x - 3} y={y - 3} width={6} height={6} fill="#fff" />);
      }
    }
  }
  return (
    <>
      {[54, 256].map((x) => (
        <path
          key={x}
          d={`M${x - 9},70 C${x - 13},56 ${x - 8},48 ${x - 4},46 V40 h8 v6 C${x + 8},48 ${x + 13},56 ${x + 9},70 Z`}
          fill="#3E6E9C"
          stroke="#1E3A5A"
          strokeWidth={2}
        />
      ))}
      <path d="M40,74 L74,30 L236,30 L270,74 Z" fill="#2B3F7A" stroke="#101F40" strokeWidth={4} strokeLinejoin="round" />
      <path d="M62,52 H248" stroke="#C9A26A" strokeWidth={22} opacity={0.35} />
      {squares}
      <Prize series="craft" y={32} />
      <rect x={44} y={72} width={222} height={14} rx={6} fill="#D8C27A" stroke="#7A6236" strokeWidth={3} />
      <path d={Array.from({ length: 22 }, (_, i) => `M${50 + i * 10},86 v6`).join(' ')} stroke="#A68E4A" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

export function Roof({ series }: { series: Series['id'] }) {
  switch (series) {
    case 'sea':
      return <Wave />;
    case 'food':
      return <SobaBowl />;
    case 'fest':
      return <Festival />;
    case 'animal':
      return <Canopy />;
    case 'craft':
      return <Craft />;
    default:
      return <Tiles />;
  }
}
