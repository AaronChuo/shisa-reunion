import { ShisaArt } from '../art/Shisa';
import type { PlaceId } from '../content/places';
import { VARIANT_BY_ID } from '../content/shisa';

// Postcard pictures, 400 × 240 each. Simple shapes in the game's palette, one per place that has a photo: they stand in
// when the photo can't load. Places with a painted scene instead fall back to the Okinawa picture.

const FONT = 'GenSen Rounded TW, PingFang TC, sans-serif';
const f1 = (v: number) => +v.toFixed(1);

function Label({ x, y, text, size = 13 }: { x: number; y: number; text: string; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fill="#173944" stroke="#fff" strokeWidth={4} paintOrder="stroke" fontFamily={FONT}>
      {text}
    </text>
  );
}

function Sky({ sea = 170, seaColor = '#5FC0D6' }: { sea?: number; seaColor?: string }) {
  return (
    <>
      <rect width={400} height={240} fill="#BFE6EE" />
      <circle cx={350} cy={42} r={20} fill="#FFD45E" />
      <rect y={sea} width={400} height={240 - sea} fill={seaColor} />
      <path d={`M0,${sea + 14} q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0`} stroke="#fff" strokeWidth={2.5} fill="none" opacity={0.6} />
    </>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M0,0 C2,-20 -2,-40 4,-60" stroke="#8A5A2B" strokeWidth={6} fill="none" strokeLinecap="round" />
      {[-60, -20, 20, 60, 100].map((a) => (
        <path key={a} d="M4,-60 q18,-10 34,4" stroke="#3E8F4A" strokeWidth={7} fill="none" strokeLinecap="round" transform={`rotate(${a} 4 -60)`} />
      ))}
    </g>
  );
}

/** 沖繩: the island chain between Taiwan and the main island, and the plane ride between them */
function Okinawa() {
  return (
    <>
      <rect width={400} height={240} fill="#7FCFE0" />
      {[30, 90, 150, 210].map((y) => (
        <path key={y} d={`M${(y * 3) % 300},${y} q10,-5 20,0 t20,0`} stroke="#B9E8F1" strokeWidth={2.5} fill="none" />
      ))}
      <path d="M22,240 C18,200 34,168 62,156 C86,148 104,162 108,186 C112,212 100,232 92,240 Z" fill="#9CCF8C" stroke="#E2C98C" strokeWidth={4} />
      <Label x={64} y={206} text="台灣" size={16} />
      <ellipse cx={128} cy={150} rx={7} ry={4} fill="#9CCF8C" stroke="#E2C98C" strokeWidth={3} />
      <Label x={128} y={136} text="與那國島" size={11} />
      <path d="M160,140 c6,-8 18,-8 22,0 c3,7 -6,12 -12,11 c-7,0 -12,-5 -10,-11 Z" fill="#9CCF8C" stroke="#E2C98C" strokeWidth={3} />
      <path d="M192,128 c4,-6 10,-12 14,-10 c3,3 -2,12 -6,16 c-4,3 -10,1 -8,-6 Z" fill="#9CCF8C" stroke="#E2C98C" strokeWidth={3} />
      <Label x={184} y={168} text="八重山" size={12} />
      <path d="M244,104 c6,-6 16,-4 16,2 c0,6 -10,10 -16,6 c-3,-2 -3,-5 0,-8 Z" fill="#9CCF8C" stroke="#E2C98C" strokeWidth={3} />
      <Label x={252} y={132} text="宮古島" size={12} />
      <path
        d="M300,128 C306,112 318,104 326,92 C334,80 340,62 352,44 C360,32 372,24 376,30 C380,38 368,50 360,62 C350,78 344,96 336,110 C328,124 314,134 304,136 Z"
        fill="#9CCF8C"
        stroke="#E2C98C"
        strokeWidth={4}
      />
      <Label x={322} y={160} text="沖繩本島" size={13} />
      {/* About an hour and a half by plane from Taiwan */}
      <path d="M96,160 Q200,40 304,112" stroke="#C8452F" strokeWidth={2.5} strokeDasharray="3 7" fill="none" strokeLinecap="round" />
      <g transform="translate(200,82) rotate(8)">
        <path d="M-14,0 L14,0 M-2,0 L-8,-10 M-2,0 L-8,10 M10,0 L6,-5 M10,0 L6,5" stroke="#173944" strokeWidth={3.5} strokeLinecap="round" />
      </g>
    </>
  );
}

/** 那霸: a ferry in the harbour, a plane overhead, and the shops of Kokusai-dori with a shisa on a roof */
function Naha() {
  const blocks: [number, number, string][] = [
    [20, 70, '#F4EADA'],
    [62, 96, '#E8D9BF'],
    [108, 60, '#F4EADA'],
    [150, 84, '#E2D2B4'],
  ];
  return (
    <>
      <Sky sea={176} />
      <g transform="translate(250,40) rotate(-8)">
        <path d="M-30,0 L30,0 M0,0 L-12,-16 M0,0 L-12,16 M24,0 L18,-8 M24,0 L18,8" stroke="#6E7F7C" strokeWidth={5} strokeLinecap="round" />
      </g>
      {blocks.map(([x, h, c]) => (
        <g key={x}>
          <rect x={x} y={176 - h} width={40} height={h} fill={c} stroke="#8C7F6B" strokeWidth={2} />
          {Array.from({ length: Math.floor(h / 24) }, (_, i) => (
            <rect key={i} x={x + 8} y={176 - h + 10 + i * 24} width={24} height={10} rx={2} fill="#9FD3E0" />
          ))}
        </g>
      ))}
      <path d="M150,92 L170,78 L190,92 Z" fill="#CD4A31" />
      <g transform="translate(170,80) scale(.32)">
        <ShisaArt v={VARIANT_BY_ID.terracotta} open />
      </g>
      <rect x={196} y={140} width={56} height={36} fill="#F4EADA" stroke="#8C7F6B" strokeWidth={2} />
      <path d="M190,142 L224,122 L258,142 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={2} />
      <rect x={202} y={150} width={44} height={12} rx={3} fill="#E2703A" />
      <Palm x={268} y={176} s={0.9} />
      {/* The ferry */}
      <path d="M262,196 L388,196 L376,222 L276,222 Z" fill="#fff" stroke="#173944" strokeWidth={2.5} />
      <rect x={292} y={178} width={64} height={18} rx={4} fill="#fff" stroke="#173944" strokeWidth={2.5} />
      <rect x={300} y={183} width={48} height={7} rx={2} fill="#2D8FD0" />
      <rect x={340} y={164} width={10} height={14} fill="#D9443A" stroke="#173944" strokeWidth={2} />
      <path d="M276,210 H376" stroke="#2D8FD0" strokeWidth={3} />
    </>
  );
}

/** 讀谷: the white lighthouse on Cape Zanpa's cliff, purple sweet-potato rows and a painted pottery jar */
function Yomitan() {
  return (
    <>
      <Sky sea={150} />
      <path d="M220,240 L232,150 C250,130 300,120 400,122 L400,240 Z" fill="#7A9A5A" stroke="#4E6B35" strokeWidth={3} />
      <path d="M232,150 L226,240" stroke="#8C7F6B" strokeWidth={6} />
      <rect x={318} y={70} width={22} height={56} fill="#fff" stroke="#173944" strokeWidth={2.5} />
      <rect x={314} y={58} width={30} height={14} rx={3} fill="#FFE07A" stroke="#173944" strokeWidth={2.5} />
      <path d="M314,58 L329,46 L344,58 Z" fill="#D9443A" stroke="#173944" strokeWidth={2.5} />
      <path d="M344,64 L392,52 M344,66 L392,78" stroke="#FFE07A" strokeWidth={4} opacity={0.7} strokeLinecap="round" />
      {/* Purple sweet potato field */}
      <rect y={180} width={220} height={60} fill="#B98B5E" />
      {[188, 204, 220].map((y) =>
        Array.from({ length: 9 }, (_, i) => (
          <ellipse key={`${y},${i}`} cx={14 + i * 24} cy={y + 4} rx={10} ry={5} fill="#8C56AA" stroke="#5E3478" strokeWidth={1.5} />
        )),
      )}
      {[188, 204, 220].map((y) =>
        Array.from({ length: 9 }, (_, i) => (
          <path key={`l${y},${i}`} d={`M${14 + i * 24},${y} q-6,-8 -10,-6 M${14 + i * 24},${y} q6,-9 10,-6`} stroke="#3E8F4A" strokeWidth={2} fill="none" />
        )),
      )}
      {/* A pottery jar from the potters' village */}
      <path
        d="M160,176 C140,174 132,150 144,136 C150,128 150,122 148,118 H180 C178,122 178,128 184,136 C196,150 188,174 168,176 Z"
        fill="#EFE4CC"
        stroke="#5A4630"
        strokeWidth={2.5}
      />
      <path d="M146,150 c8,-8 14,4 22,-4 c8,-8 14,4 18,0" stroke="#3E6E9C" strokeWidth={3} fill="none" />
    </>
  );
}

/** 美麗海: the big tank with a whale shark and a manta ray gliding past, and a parent and child watching */
function Motobu() {
  const spots: [number, number][] = [
    [-30, -6],
    [-14, -10],
    [2, -4],
    [18, -9],
    [-22, 4],
    [10, 4],
  ];
  return (
    <>
      <rect width={400} height={240} fill="#173944" />
      <rect x={20} y={16} width={360} height={190} rx={18} fill="#1E6FA8" />
      {[60, 140, 220, 300].map((x) => (
        <path key={x} d={`M${x},16 L${x - 30},206 L${x + 10},206 Z`} fill="#fff" opacity={0.08} />
      ))}
      <rect x={20} y={176} width={360} height={30} fill="#E8D9A8" opacity={0.6} />
      {/* Whale shark */}
      <g transform="translate(170,90)">
        <path d="M-70,0 C-60,-26 40,-30 70,-6 L92,-24 L88,0 L92,24 L70,6 C40,30 -60,26 -70,0 Z" fill="#2F4F7F" stroke="#0E1C30" strokeWidth={3} />
        <path d="M-70,0 C-50,14 30,18 70,6" fill="#E8EEF5" opacity={0.85} />
        {spots.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={2.6} fill="#EAF4FF" />
        ))}
        <circle cx={-52} cy={-6} r={3} fill="#0E1C30" />
        <path d="M-10,-22 L4,-38 L12,-20 Z" fill="#2F4F7F" stroke="#0E1C30" strokeWidth={2.5} />
      </g>
      {/* Manta ray */}
      <g transform="translate(300,140) rotate(-10)">
        <path d="M0,-6 C10,-8 30,-24 48,-14 C30,-6 18,4 0,10 C-18,4 -30,-6 -48,-14 C-30,-24 -10,-8 0,-6 Z" fill="#2B3A55" stroke="#0D1420" strokeWidth={2.5} />
        <path d="M0,10 L0,34" stroke="#2B3A55" strokeWidth={3} />
        <path d="M-12,-10 l-4,-8 M12,-10 l4,-8" stroke="#2B3A55" strokeWidth={4} strokeLinecap="round" />
      </g>
      {[
        [60, 150, '#F7C843'],
        [90, 160, '#F57C1F'],
        [250, 50, '#F7C843'],
      ].map(([x, y, c]) => (
        <path key={`${x}`} d={`M${x},${y} c6,-6 14,-6 18,0 c-4,6 -12,6 -18,0 Z M${x},${y} l-6,-4 v8 Z`} fill={c as string} />
      ))}
      {/* Silhouettes of a parent and child at the glass */}
      <g fill="#0B1C24">
        <circle cx={70} cy={196} r={14} />
        <path d="M50,240 C50,214 90,214 90,240 Z" />
        <circle cx={106} cy={212} r={10} />
        <path d="M92,240 C92,222 120,222 120,240 Z" />
      </g>
    </>
  );
}

/** 古宇利: the long bridge over blue-green water to the island, and the heart rock */
function Kouri() {
  const piers = Array.from({ length: 9 }, (_, i) => 40 + i * 30);
  return (
    <>
      <Sky sea={130} seaColor="#4FC6C0" />
      <path d="M250,132 C270,96 360,92 400,104 L400,134 Z" fill="#7FB86E" stroke="#4E8A3A" strokeWidth={3} />
      <path d="M244,134 C270,128 360,126 400,132" stroke="#F3E3B8" strokeWidth={6} fill="none" />
      {/* The bridge: a long gentle deck on piers */}
      {piers.map((x) => {
        const y = 150 - Math.sin(((x - 40) / 240) * Math.PI) * 18;
        return <rect key={x} x={x - 3} y={f1(y)} width={6} height={f1(240 - y)} fill="#D9CFBD" />;
      })}
      <path d="M0,160 Q150,124 280,134" stroke="#F2EEE6" strokeWidth={9} fill="none" />
      <path d="M0,155 Q150,119 280,129" stroke="#8C7F6B" strokeWidth={2} fill="none" />
      {/* Heart rock */}
      <g transform="translate(330,190)">
        <path d="M0,18 C-22,4 -26,-14 -12,-20 C-4,-24 0,-16 0,-12 C0,-16 4,-24 12,-20 C26,-14 22,4 0,18 Z" fill="#8C7F6B" stroke="#4F463A" strokeWidth={2.5} />
        <path d="M0,18 v10" stroke="#4F463A" strokeWidth={6} />
        <ellipse cx={-34} cy={22} rx={14} ry={10} fill="#8C7F6B" stroke="#4F463A" strokeWidth={2.5} />
      </g>
    </>
  );
}

/** 首里: the red main hall of Shuri Castle on its stone base, with the Shurei gate in front */
function Shuri() {
  return (
    <>
      <rect width={400} height={240} fill="#BFE6EE" />
      <circle cx={52} cy={40} r={18} fill="#FFD45E" />
      <rect y={196} width={400} height={44} fill="#D8CFC0" />
      {/* Main hall */}
      <rect x={150} y={96} width={200} height={100} fill="#C23A2B" stroke="#5A140D" strokeWidth={3} />
      <path d="M134,100 L170,64 L330,64 L366,100 Z" fill="#CD4A31" stroke="#5A140D" strokeWidth={3} />
      <path d="M190,64 L216,40 L284,40 L310,64 Z" fill="#CD4A31" stroke="#5A140D" strokeWidth={3} />
      <path d="M232,52 Q250,40 268,52" stroke="#E8B83A" strokeWidth={4} fill="none" />
      <rect x={226} y={70} width={48} height={18} rx={3} fill="#E8B83A" stroke="#5A140D" strokeWidth={2} />
      {[168, 196, 304, 332].map((x) => (
        <rect key={x} x={x} y={112} width={16} height={84} fill="#9C2A1E" />
      ))}
      <path d="M216,196 L230,150 H270 L284,196 Z" fill="#E8D9BF" stroke="#8C7F6B" strokeWidth={2} />
      {/* Shurei gate */}
      <g transform="translate(70,0)">
        <rect x={-40} y={148} width={8} height={48} fill="#9C2A1E" />
        <rect x={32} y={148} width={8} height={48} fill="#9C2A1E" />
        <rect x={-6} y={148} width={12} height={48} fill="#9C2A1E" />
        <path d="M-56,150 L-36,126 L36,126 L56,150 Z" fill="#CD4A31" stroke="#5A140D" strokeWidth={2.5} />
        <path d="M-38,126 L-22,108 L22,108 L38,126 Z" fill="#CD4A31" stroke="#5A140D" strokeWidth={2.5} />
        <rect x={-18} y={128} width={36} height={12} rx={2} fill="#173944" />
        <text x={0} y={137.5} textAnchor="middle" fontSize={8} fill="#E8B83A" fontFamily={FONT}>
          守禮之邦
        </text>
      </g>
    </>
  );
}

/** 中城城跡: curved stone walls on a green hill, with the stone arch gate the Perry expedition admired */
function Nakagusuku() {
  return (
    <>
      <rect width={400} height={240} fill="#BFE6EE" />
      <circle cx={52} cy={40} r={18} fill="#FFD45E" />
      <path d="M0,170 C90,140 180,132 260,140 C320,146 370,156 400,166 L400,240 L0,240 Z" fill="#7DBE93" />
      {/* Curved walls, stepping up the hill like waves */}
      <path d="M30,196 C40,140 90,118 150,116 C210,114 250,124 280,150 L290,200 Z" fill="#D8CFC0" stroke="#8C7F6B" strokeWidth={3} />
      <path d="M44,170 C70,134 110,126 150,126 M44,186 C80,150 120,142 168,142" stroke="#B7AC97" strokeWidth={2} fill="none" />
      <path d="M230,200 C236,150 276,120 330,118 C360,118 380,130 392,146 L392,204 Z" fill="#E2D9C8" stroke="#8C7F6B" strokeWidth={3} />
      {/* Arch gate */}
      <path
        d="M150,200 V150 Q150,128 172,128 H196 Q218,128 218,150 V200 H200 V156 Q200,144 184,144 Q168,144 168,156 V200 Z"
        fill="#CFC5B2"
        stroke="#6E6354"
        strokeWidth={3}
      />
      <path d="M184,128 l-5,-10 h10 Z" fill="#B7AC97" stroke="#6E6354" strokeWidth={2} />
      <rect y={200} width={400} height={40} fill="#94CEA6" />
      <Label x={184} y={224} text="石拱門" size={14} />
      <Label x={330} y={110} text="彎彎的石牆" size={12} />
    </>
  );
}

/** 宮古: the long Irabu bridge over Miyako-blue sea, and the lighthouse on Higashi-hennazaki */
function Miyako() {
  return (
    <>
      <Sky sea={150} seaColor="#1E9ED8" />
      <rect y={176} width={400} height={64} fill="#5FD0E6" opacity={0.7} />
      {/* Irabu island on the left, Miyako on the right */}
      <path d="M0,150 C20,132 60,128 84,140 L92,152 L0,156 Z" fill="#7DBE93" />
      <path d="M330,150 C350,128 384,124 400,132 V156 L326,156 Z" fill="#7DBE93" />
      {/* The bridge: a long deck that rises in the middle so ships can pass */}
      <path d="M84,146 C160,146 190,112 220,112 C250,112 270,146 340,146" stroke="#F2EEE6" strokeWidth={7} fill="none" />
      <path d="M84,146 C160,146 190,112 220,112 C250,112 270,146 340,146" stroke="#B7AC97" strokeWidth={2} fill="none" transform="translate(0,5)" />
      {[110, 140, 170, 200, 240, 270, 300].map((x) => (
        <rect key={x} x={x - 2} y={x < 220 ? 146 - (x - 84) * 0.25 : 120 + (x - 240) * 0.3} width={4} height={30} fill="#D8CFC0" />
      ))}
      {/* Lighthouse on the cape */}
      <path d="M352,132 L356,84 H368 L372,132 Z" fill="#FFFFFF" stroke="#8C7F6B" strokeWidth={2} />
      <rect x={354} y={74} width={16} height={10} fill="#CD4A31" />
      <Label x={212} y={98} text="伊良部大橋" size={13} />
      <Label x={200} y={214} text="宮古藍的海" size={13} />
    </>
  );
}

/** 久米: the white Hatenohama sandbar in a turquoise sea, and the turtle-shell rocks of Tatami-ishi at low tide */
function Kumejima() {
  return (
    <>
      <Sky sea={110} seaColor="#4FC6D8" />
      <path
        d="M40,150 C120,134 220,128 300,136 C340,140 370,146 390,152 C340,160 240,162 140,160 C90,158 56,156 40,150 Z"
        fill="#FFF6DA"
        stroke="#F0DDA8"
        strokeWidth={3}
      />
      <Label x={214} y={128} text="果之濱" size={14} />
      <path d="M0,200 Q200,184 400,200 V240 H0 Z" fill="#E8D8B0" />
      {[
        [60, 214],
        [104, 210],
        [148, 214],
        [192, 210],
        [236, 214],
        [82, 230],
        [126, 228],
        [170, 230],
        [214, 228],
      ].map(([x, y]) => (
        <path key={`${x},${y}`} d={`M${x - 18},${y} l9,-8 h18 l9,8 l-9,8 h-18 Z`} fill="#8C8478" stroke="#5E574C" strokeWidth={2.5} />
      ))}
      <Label x={320} y={222} text="疊石" size={14} />
    </>
  );
}

export function PostcardArt({ id }: { id: PlaceId }) {
  switch (id) {
    case 'naha':
      return <Naha />;
    case 'yomitan':
      return <Yomitan />;
    case 'motobu':
      return <Motobu />;
    case 'kouri':
      return <Kouri />;
    case 'nakagusuku':
      return <Nakagusuku />;
    case 'miyako':
      return <Miyako />;
    case 'shuri':
      return <Shuri />;
    case 'kumejima':
      return <Kumejima />;
    default:
      return <Okinawa />;
  }
}
