import type { ReactNode } from 'react';
import { Star4 } from '../art/Shisa';

// The decorations of 西薩的家, drawn like the shisa: flat colours with a darker outline and a highlight or two, each in
// a 100 × 100 box with its feet at the bottom. The white sticker edge comes from CSS, so the same art works in the
// drawer, in the yard and in a capsule. No gradients or clip paths: the same picture is on screen several times at once,
// and an id shared between copies would break. Rare ones are gold and twinkle, like the rare shisa.

const f1 = (v: number) => +v.toFixed(1);

/** A hibiscus flower: five round petals, a dark eye and the long stamen */
function Hibiscus({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = [0, 1, 2, 3, 4].map((k) => {
    const a = ((k * 72 - 90) * Math.PI) / 180;
    return [f1(cx + Math.cos(a) * r * 0.95), f1(cy + Math.sin(a) * r * 0.95)] as const;
  });
  return (
    <g>
      <g fill="#9E1F2C" stroke="#9E1F2C" strokeWidth={5}>
        {pts.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g fill="#E8434F">
        {pts.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={f1(r * 0.5)} fill="#B81E35" />
      <path d={`M${cx},${cy} l${f1(r * 1.2)},${f1(-r * 1.2)}`} stroke="#F6C445" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={f1(cx + r * 1.2)} cy={f1(cy - r * 1.2)} r={2.4} fill="#F6C445" />
    </g>
  );
}

/** The twinkles beside a rare decoration */
function Sparks({ a, b }: { a: [number, number]; b: [number, number] }) {
  return (
    <>
      <Star4 x={a[0]} y={a[1]} r={7} fill="#FFE27A" className="twinkle" />
      <Star4 x={b[0]} y={b[1]} r={5} fill="#FFFFFF" className="twinkle" />
    </>
  );
}

/** A thick line with a darker edge, for branches, spines and tails */
function Limb({ d, w, fill, edge }: { d: string; w: number; fill: string; edge: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={edge} strokeWidth={w + 4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** A small scallop shell hanging from its hinge at (x, y) */
function Scallop({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path d="M0,0 L-9,12 A11,8 0 0 0 9,12 Z" fill="#F7D9C4" stroke="#B07A5E" strokeWidth={2} strokeLinejoin="round" />
      <path d="M0,0 L-5,14 M0,0 L0,15 M0,0 L5,14" stroke="#D9A88C" strokeWidth={1.5} />
    </g>
  );
}

/** A tree trunk from the ground up to y */
const trunk = (x: number, top: number, w: number) => (
  <path
    d={`M${x - w / 2 - 2},98 L${x - w / 2},${top} L${x + w / 2},${top} L${x + w / 2 + 2},98 Z`}
    fill="#7A5230"
    stroke="#43260F"
    strokeWidth={2.5}
    strokeLinejoin="round"
  />
);

const ART: Record<string, ReactNode> = {
  // ---------- every house starts with these ----------
  hibiscus: (
    <>
      <ellipse cx={32} cy={52} rx={17} ry={9} fill="#4E9A4A" stroke="#2F6A35" strokeWidth={3} transform="rotate(-28 32 52)" />
      <ellipse cx={68} cy={50} rx={17} ry={9} fill="#4E9A4A" stroke="#2F6A35" strokeWidth={3} transform="rotate(28 68 50)" />
      <ellipse cx={52} cy={40} rx={11} ry={17} fill="#5DAA55" stroke="#2F6A35" strokeWidth={3} />
      <Hibiscus cx={36} cy={36} r={7} />
      <Hibiscus cx={64} cy={28} r={7.5} />
      <path d="M27,62 L73,62 L67,98 L33,98 Z" fill="#C8693A" stroke="#7E3B1C" strokeWidth={3} strokeLinejoin="round" />
      <rect x={23} y={57} width={54} height={11} rx={4} fill="#D97B4A" stroke="#7E3B1C" strokeWidth={3} />
    </>
  ),
  // A stone tablet against wandering spirits, set where a road meets the house
  stone: (
    <>
      <path d="M26,98 L26,24 Q26,8 42,8 L58,8 Q74,8 74,24 L74,98 Z" fill="#B6B0A2" stroke="#5F594D" strokeWidth={3} strokeLinejoin="round" />
      <rect x={34} y={17} width={32} height={74} rx={4} fill="#D4CFC2" />
      <g fontFamily="GenSen Rounded TW, PingFang TC, sans-serif" fontSize={20} fontWeight={700} fill="#2E2A24" textAnchor="middle">
        <text x={50} y={39}>
          石
        </text>
        <text x={50} y={62}>
          敢
        </text>
        <text x={50} y={85}>
          當
        </text>
      </g>
    </>
  ),
  // A big glazed water jar with a woven lid, kept by the house to catch rain
  jar: (
    <>
      <path d="M25,44 C14,64 18,88 32,98 L68,98 C82,88 86,64 75,44 Z" fill="#7B4B2A" stroke="#43260F" strokeWidth={3} strokeLinejoin="round" />
      <path d="M22,56 C40,64 60,64 78,56 L77,49 C60,57 40,57 23,49 Z" fill="#3F7461" />
      <path d="M30,62 q2,10 0,18 M44,64 q2,12 0,22 M58,64 q2,10 0,16 M70,62 q2,8 0,14" stroke="#3F7461" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={50} cy={43} rx={27} ry={7} fill="#8E5C36" stroke="#43260F" strokeWidth={3} />
      <ellipse cx={50} cy={38} rx={28} ry={6.5} fill="#D2AC72" stroke="#7A5A2C" strokeWidth={3} />
      <path d="M36,34 v8 M50,32.5 v11 M64,34 v8" stroke="#7A5A2C" strokeWidth={2} />
      <rect x={44} y={29} width={12} height={6} rx={3} fill="#B98E52" stroke="#7A5A2C" strokeWidth={2} />
    </>
  ),

  // ---------- 傳統 ----------
  // Fukugi, the thick-leaved trees planted round Okinawan houses against the wind
  fukugi: (
    <>
      {trunk(50, 64, 10)}
      <ellipse cx={50} cy={40} rx={30} ry={37} fill="#3E7F4C" stroke="#2A5B36" strokeWidth={3} />
      <ellipse cx={40} cy={28} rx={12} ry={16} fill="#4F9A5A" />
      <ellipse cx={61} cy={47} rx={10} ry={13} fill="#4F9A5A" />
      <g fill="#2F6A3C">
        <ellipse cx={34} cy={52} rx={4} ry={6} />
        <ellipse cx={52} cy={20} rx={4} ry={6} />
        <ellipse cx={66} cy={28} rx={4} ry={6} />
        <ellipse cx={48} cy={62} rx={4} ry={6} />
      </g>
    </>
  ),
  // The banana plant whose fibre is woven into bashofu cloth
  banana: (
    <>
      <path d="M45,98 L47,48 L55,48 L57,98 Z" fill="#8DB25E" stroke="#4E6B33" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M49,56 v36 M53,56 v36" stroke="#6E9446" strokeWidth={1.5} />
      <g fill="#6FB04A" stroke="#3E7A2A" strokeWidth={2.5} strokeLinejoin="round">
        <path d="M50,52 C32,38 14,40 4,56 C20,50 34,52 50,57 Z" />
        <path d="M52,52 C70,36 86,38 96,50 C80,47 66,50 52,57 Z" />
        <path d="M50,50 C38,30 37,14 44,3 C51,18 53,32 52,50 Z" />
        <path d="M52,50 C60,30 70,18 84,14 C76,28 66,40 54,52 Z" />
        <path d="M49,50 C40,36 26,26 14,26 C24,34 36,42 48,53 Z" />
      </g>
      <path
        d="M50,54 C34,44 20,44 8,54 M52,54 C68,42 82,42 92,50 M51,48 C44,32 42,18 45,8 M53,50 C62,34 70,24 80,18 M48,51 C38,40 28,32 18,29"
        stroke="#A6CF6E"
        strokeWidth={1.5}
        fill="none"
      />
      <path d="M44,58 Q38,62 38,70" stroke="#4E6B33" strokeWidth={2.5} fill="none" />
      <g fill="#C9D65A" stroke="#6E7F2A" strokeWidth={1.5}>
        <path d="M38,68 q-6,4 -4,12 q4,-2 6,-10 Z" />
        <path d="M40,68 q-1,8 4,12 q2,-4 -2,-12 Z" />
        <path d="M37,70 q-9,0 -10,7 q5,1 9,-5 Z" />
      </g>
    </>
  ),
  // A stone hand mill, for grinding beans into soy milk for island tofu
  millstone: (
    <>
      <path d="M16,72 L16,88 A34,10 0 0 0 84,88 L84,72 Z" fill="#9E988C" stroke="#5F594D" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={72} rx={34} ry={10} fill="#B6B0A2" stroke="#5F594D" strokeWidth={3} />
      <path d="M82,74 L94,78 L92,84 L82,82 Z" fill="#9E988C" stroke="#5F594D" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M24,52 L24,66 A26,8 0 0 0 76,66 L76,52 Z" fill="#A8A295" stroke="#5F594D" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={52} rx={26} ry={8} fill="#C9C3B6" stroke="#5F594D" strokeWidth={3} />
      <ellipse cx={44} cy={51} rx={5} ry={2.5} fill="#5F594D" />
      <path d="M66,54 L70,26" stroke="#5E4325" strokeWidth={8} strokeLinecap="round" />
      <path d="M66,54 L70,26" stroke="#B48A55" strokeWidth={4} strokeLinecap="round" />
      <path d="M30,60 h8 M58,62 h10" stroke="#8C867A" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  // A woven bamboo basket of purple sweet potatoes
  basket: (
    <>
      <path d="M28,46 Q50,4 72,46" fill="none" stroke="#7A5A2C" strokeWidth={8} strokeLinecap="round" />
      <path d="M28,46 Q50,4 72,46" fill="none" stroke="#D9B26A" strokeWidth={4} strokeLinecap="round" />
      <path d="M22,50 Q26,36 40,38 Q52,40 50,50 Z" fill="#8E4A9E" stroke="#4E2459" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M46,50 Q50,34 64,36 Q78,38 80,50 Z" fill="#A05AB0" stroke="#4E2459" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M17,44 L23,47 M83,44 L78,47" stroke="#4E2459" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M16,52 L84,52 L76,97 L24,97 Z" fill="#D9B26A" stroke="#7A5A2C" strokeWidth={3} strokeLinejoin="round" />
      <path d="M19,66 H81 M21,80 H79" stroke="#B48A45" strokeWidth={2.5} />
      <path d="M31,52 L33,97 M44,52 L45,97 M56,52 L55,97 M69,52 L67,97" stroke="#B48A45" strokeWidth={2} />
      <rect x={12} y={46} width={76} height={10} rx={5} fill="#E8C886" stroke="#7A5A2C" strokeWidth={3} />
    </>
  ),
  // A stone well with its pulley and bucket, where a village drew its water
  well: (
    <>
      <path d="M22,62 V12 M78,62 V12" stroke="#5E4325" strokeWidth={6} strokeLinecap="round" />
      <path d="M16,14 H84" stroke="#5E4325" strokeWidth={7} strokeLinecap="round" />
      <path d="M16,14 H84" stroke="#9C7443" strokeWidth={3} strokeLinecap="round" />
      <circle cx={50} cy={21} r={6} fill="#9C7443" stroke="#5E4325" strokeWidth={2.5} />
      <path d="M50,27 V40" stroke="#8A6A44" strokeWidth={2} />
      <path d="M14,60 L14,88 A36,9 0 0 0 86,88 L86,60 Z" fill="#B6B0A2" stroke="#5F594D" strokeWidth={3} strokeLinejoin="round" />
      <path d="M14,74 Q50,82 86,74 M32,62 v12 M58,64 v13 M24,77 v13 M46,80 v14 M70,79 v13" stroke="#8C867A" strokeWidth={2} fill="none" />
      <ellipse cx={50} cy={60} rx={36} ry={9} fill="#C9C3B6" stroke="#5F594D" strokeWidth={3} />
      <ellipse cx={50} cy={60} rx={27} ry={5.5} fill="#2F5A66" />
      <path d="M41,40 L59,40 L57,53 L43,53 Z" fill="#9C7443" stroke="#5E4325" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M42,45 H58" stroke="#5E4325" strokeWidth={2} />
    </>
  ),
  // The spider conch, shaped like the character 水 and hung by the door against fire and harm
  conch: (
    <>
      <Limb d="M30,52 Q16,40 14,22" w={5} fill="#F4DDB8" edge="#8A5A33" />
      <Limb d="M42,46 Q38,28 44,12" w={5} fill="#F4DDB8" edge="#8A5A33" />
      <Limb d="M58,46 Q64,30 76,24" w={5} fill="#F4DDB8" edge="#8A5A33" />
      <Limb d="M72,58 Q86,52 92,40" w={5} fill="#F4DDB8" edge="#8A5A33" />
      <Limb d="M26,70 Q14,80 10,94" w={5} fill="#F4DDB8" edge="#8A5A33" />
      <Limb d="M70,74 Q80,86 88,94" w={5} fill="#F4DDB8" edge="#8A5A33" />
      <path
        d="M22,66 C18,50 34,40 52,42 C72,44 82,58 76,72 C70,86 50,90 36,84 C28,80 24,74 22,66 Z"
        fill="#F2D7B0"
        stroke="#8A5A33"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M58,56 C50,52 42,58 46,64 C50,70 58,66 56,60" stroke="#8A5A33" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <g fill="#B5763E">
        <ellipse cx={34} cy={60} rx={4} ry={3} />
        <ellipse cx={66} cy={66} rx={4} ry={3} />
        <ellipse cx={44} cy={78} rx={4} ry={2.5} />
        <ellipse cx={62} cy={50} rx={3} ry={2} />
      </g>
    </>
  ),
  // Red roof tiles stacked by the house, waiting to go up
  tiles: (
    <>
      {[
        [14, 86],
        [38, 86],
        [62, 86],
        [26, 70],
        [50, 70],
        [38, 54],
      ].map(([x, y]) => (
        <g key={`${x},${y}`}>
          <path d={`M${x},${y} a12,10 0 0 1 24,0 v10 a12,10 0 0 0 -24,0 Z`} fill="#CD4A31" stroke="#86281A" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M${x + 4},${y - 3} a8,6 0 0 1 9,-4`} stroke="#F2A58F" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // Rare: a golden stone tablet
  goldStone: (
    <>
      <path d="M26,98 L26,24 Q26,8 42,8 L58,8 Q74,8 74,24 L74,98 Z" fill="#E8B83A" stroke="#8A6410" strokeWidth={3} strokeLinejoin="round" />
      <rect x={34} y={17} width={32} height={74} rx={4} fill="#F7DC86" />
      <path d="M38,22 L38,84" stroke="#FFF6D6" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <g fontFamily="GenSen Rounded TW, PingFang TC, sans-serif" fontSize={20} fontWeight={700} fill="#7A5208" textAnchor="middle">
        <text x={50} y={39}>
          石
        </text>
        <text x={50} y={62}>
          敢
        </text>
        <text x={50} y={85}>
          當
        </text>
      </g>
      <Sparks a={[15, 20]} b={[86, 52]} />
    </>
  ),

  // ---------- 海洋 ----------
  // A glass fishing float in its rope net
  float: (
    <>
      <path d="M50,30 C40,18 42,8 50,6 C58,8 60,18 50,30" fill="none" stroke="#8B6A3E" strokeWidth={3} />
      <circle cx={50} cy={64} r={32} fill="#4FB3C8" fillOpacity={0.88} stroke="#1F6E80" strokeWidth={3} />
      <ellipse cx={38} cy={52} rx={9} ry={6} fill="#fff" opacity={0.55} transform="rotate(-30 38 52)" />
      <circle cx={64} cy={76} r={3} fill="#fff" opacity={0.5} />
      <circle cx={58} cy={82} r={2} fill="#fff" opacity={0.5} />
      <g stroke="#8B6A3E" strokeWidth={2.5} fill="none">
        <path d="M50,30 C30,40 24,72 34,92" />
        <path d="M50,30 C70,40 76,72 66,92" />
        <path d="M50,30 V96" />
        <path d="M20,54 C40,62 60,62 80,54" />
        <path d="M19,74 C40,82 60,82 81,74" />
      </g>
    </>
  ),
  // Branching coral on a rock
  coralRock: (
    <>
      <path d="M12,97 Q14,82 30,80 L72,80 Q88,82 90,97 Z" fill="#8C9A9E" stroke="#4F5D62" strokeWidth={3} strokeLinejoin="round" />
      <Limb
        d="M50,82 V48 M50,66 Q36,60 31,40 M50,58 Q64,52 69,32 M31,48 Q23,44 21,30 M67,42 Q77,38 80,24 M50,50 Q47,36 52,22"
        w={6}
        fill="#F27A7A"
        edge="#A8343E"
      />
      <g fill="#FFC2BC">
        <circle cx={31} cy={40} r={2} />
        <circle cx={52} cy={24} r={2} />
        <circle cx={69} cy={33} r={2} />
        <circle cx={21} cy={31} r={2} />
        <circle cx={80} cy={25} r={2} />
      </g>
      <path d="M26,88 q4,-3 8,0 M60,90 q5,-3 10,0" stroke="#B4C0C3" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  // A fishing net heaped on the sand, with its red and white floats
  net: (
    <>
      <path d="M14,97 V16 M86,97 V16" stroke="#5E4325" strokeWidth={6} strokeLinecap="round" />
      <path d="M8,18 H92" stroke="#5E4325" strokeWidth={6} strokeLinecap="round" />
      <path d="M8,18 H92" stroke="#9C7443" strokeWidth={2.5} strokeLinecap="round" />
      <path
        d="M20,20 L80,20 L84,76 Q72,82 62,76 Q50,84 38,76 Q28,82 16,76 Z"
        fill="#E3CFA3"
        fillOpacity={0.55}
        stroke="#8A6A44"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <g stroke="#A8895E" strokeWidth={1.8}>
        <path d="M30,20 L28,78 M40,20 L39,78 M50,20 V80 M60,20 L61,78 M70,20 L72,78" />
        <path d="M19,32 H81 M18,44 H82 M17,56 H83 M17,67 H83" />
      </g>
      {[
        [16, 76, '#D9412E'],
        [38, 77, '#FFFFFF'],
        [62, 77, '#D9412E'],
        [84, 76, '#FFFFFF'],
      ].map(([x, y, c]) => (
        <ellipse key={x} cx={x as number} cy={y as number} rx={6} ry={5} fill={c as string} stroke="#6B4A2B" strokeWidth={2} />
      ))}
    </>
  ),
  // A sabani, the narrow wooden fishing boat of Okinawa, with its sail
  sabani: (
    <>
      <path d="M46,6 V74" stroke="#5E4325" strokeWidth={4} strokeLinecap="round" />
      <path d="M49,10 Q70,12 84,18 Q78,40 82,60 Q66,62 49,66 Z" fill="#F4EAD5" stroke="#8A6A44" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M4,62 Q12,70 22,72 Q60,74 96,64 L88,84 Q52,96 18,88 Q8,80 4,62 Z" fill="#8A5A33" stroke="#4A2E16" strokeWidth={3} strokeLinejoin="round" />
      <path d="M12,74 Q55,80 92,70" stroke="#C8452F" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <path d="M20,84 Q52,90 84,80" stroke="#6E4528" strokeWidth={2} fill="none" />
    </>
  ),
  // A starfish
  starfish: (
    <>
      <path
        d="M50,22 L59,47 L86,48 L65,64 L72,90 L50,75 L28,90 L35,64 L14,48 L41,47 Z"
        fill="#F2914A"
        stroke="#B5561E"
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path
        d="M50,22 L59,47 L86,48 L65,64 L72,90 L50,75 L28,90 L35,64 L14,48 L41,47 Z"
        fill="#F2914A"
        stroke="#F2914A"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <g fill="#FFD9A8">
        <circle cx={50} cy={58} r={3.5} />
        <circle cx={50} cy={38} r={2.2} />
        <circle cx={66} cy={53} r={2.2} />
        <circle cx={61} cy={74} r={2.2} />
        <circle cx={39} cy={74} r={2.2} />
        <circle cx={34} cy={53} r={2.2} />
      </g>
    </>
  ),
  // A wind chime of shells that rings when the wind blows
  chime: (
    <>
      <path d="M50,2 V10" stroke="#7A5A2C" strokeWidth={2.5} />
      <path d="M34,16 V62 M50,18 V76 M66,16 V64 M42,17 V48 M58,17 V50" stroke="#8A6A44" strokeWidth={1.5} />
      <ellipse cx={50} cy={14} rx={20} ry={5} fill="#C9A26B" stroke="#7A5A2C" strokeWidth={2.5} />
      <g fill="#FBF3E6" stroke="#B07A5E" strokeWidth={1.5}>
        <ellipse cx={34} cy={38} rx={3} ry={4} />
        <ellipse cx={66} cy={40} rx={3} ry={4} />
        <ellipse cx={50} cy={52} rx={3} ry={4} />
      </g>
      <Scallop x={42} y={48} />
      <Scallop x={58} y={50} />
      <Scallop x={34} y={62} />
      <Scallop x={66} y={64} />
      <Scallop x={50} y={76} />
    </>
  ),
  // A tank of tropical fish: a clownfish and a blue tang among the weed
  fishTank: (
    <>
      <rect x={10} y={88} width={80} height={9} rx={3} fill="#6B4A2B" stroke="#43260F" strokeWidth={2.5} />
      <rect x={12} y={30} width={76} height={58} rx={4} fill="#8FD8EA" stroke="#2B6F80" strokeWidth={3} />
      <path d="M14,78 Q50,72 86,78 V86 H14 Z" fill="#F1DFAE" />
      <path d="M26,82 Q21,70 28,60 Q33,52 28,44 M76,82 Q80,72 74,64" stroke="#3F8A5A" strokeWidth={4} fill="none" strokeLinecap="round" />
      <g transform="translate(46,54)">
        <path d="M10,0 L18,-6 L18,6 Z" fill="#F2913A" stroke="#A3501A" strokeWidth={1.5} strokeLinejoin="round" />
        <ellipse cx={0} cy={0} rx={11} ry={7} fill="#F2913A" stroke="#A3501A" strokeWidth={2} />
        <path d="M-4,-6.5 Q-1,0 -4,6.5 M4,-6.6 Q7,0 4,6.6" stroke="#fff" strokeWidth={3} fill="none" />
        <circle cx={-7} cy={-1.5} r={1.6} fill="#173944" />
      </g>
      <g transform="translate(64,70)">
        <path d="M8,0 L15,-5 L15,5 Z" fill="#F2C14E" stroke="#1F3D73" strokeWidth={1.5} strokeLinejoin="round" />
        <ellipse cx={0} cy={0} rx={9} ry={6} fill="#3B7BD8" stroke="#1F3D73" strokeWidth={2} />
        <circle cx={-5} cy={-1.5} r={1.4} fill="#173944" />
      </g>
      <g fill="none" stroke="#fff" strokeWidth={1.5}>
        <circle cx={34} cy={44} r={2.5} />
        <circle cx={38} cy={36} r={1.8} />
      </g>
      <path d="M16,36 H84" stroke="#C9F0F8" strokeWidth={3} />
      <rect x={8} y={26} width={84} height={6} rx={3} fill="#2B6F80" />
    </>
  ),
  // Rare: the great green turban, whose shell shines like a rainbow inside and is set into Ryukyu lacquerware
  turban: (
    <>
      <path
        d="M18,82 C10,56 28,28 54,26 C78,24 90,46 86,66 C82,86 62,96 40,93 C30,92 22,88 18,82 Z"
        fill="#6E9E7E"
        stroke="#3E5E48"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M72,40 C60,34 48,44 51,56 C54,64 66,64 67,56 C68,50 62,48 60,52" stroke="#3E5E48" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d="M78,62 C70,74 58,80 46,80" stroke="#8FBF9C" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={36} cy={74} rx={17} ry={14} fill="#F3EEF8" stroke="#E8B83A" strokeWidth={3} />
      <path d="M24,70 Q36,62 48,70 M24,77 Q36,69 49,77 M27,83 Q37,77 46,83" stroke="#B9D4F2" strokeWidth={2} fill="none" />
      <path d="M26,73 Q36,66 46,73" stroke="#F2B9D4" strokeWidth={2} fill="none" />
      <path d="M28,80 Q37,74 45,80" stroke="#F2DFA0" strokeWidth={2} fill="none" />
      <Sparks a={[14, 34]} b={[90, 30]} />
    </>
  ),

  // ---------- 美食 ----------
  pineapple: (
    <>
      <g fill="#4E9A4A" stroke="#2F6A35" strokeWidth={2.5} strokeLinejoin="round">
        <path d="M50,40 L28,18 L44,30 Z" />
        <path d="M52,40 L74,18 L58,30 Z" />
        <path d="M50,40 L40,8 L48,20 L50,2 L54,20 L62,6 L56,40 Z" />
      </g>
      <ellipse cx={51} cy={67} rx={24} ry={30} fill="#F2B33D" />
      <g stroke="#C98A1E" strokeWidth={2} fill="none">
        <path d="M33,49 L63,91 M28,63 L50,94 M40,39 L73,85 M54,37 L77,70" />
        <path d="M69,49 L39,91 M74,63 L52,94 M62,39 L29,85 M48,37 L25,70" />
      </g>
      <ellipse cx={51} cy={67} rx={24} ry={30} fill="none" stroke="#9A6512" strokeWidth={3} />
    </>
  ),
  // A bamboo trellis covered in goya, Okinawa's bitter melon
  goyaVine: (
    <>
      <path d="M18,98 V24 M82,98 V24" stroke="#8A6A2C" strokeWidth={7} strokeLinecap="round" />
      <path d="M18,98 V24 M82,98 V24" stroke="#D9B26A" strokeWidth={3} strokeLinecap="round" />
      <path d="M10,28 H90 M12,22 H88" stroke="#B48A45" strokeWidth={4} strokeLinecap="round" />
      <g fill="#5DAA55" stroke="#2F6A35" strokeWidth={2}>
        {[14, 26, 38, 50, 62, 74, 86].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 18 : 30} r={8} />
        ))}
        <circle cx={20} cy={42} r={6} />
        <circle cx={80} cy={44} r={6} />
      </g>
      <g fill="#F2D33A">
        <circle cx={44} cy={16} r={2.5} />
        <circle cx={70} cy={30} r={2.5} />
      </g>
      {[
        [34, 36, 30],
        [54, 36, 24],
        [70, 38, 18],
      ].map(([x, y, h]) => (
        <g key={x}>
          <path d={`M${x},${y - 4} V${y}`} stroke="#3E7A2A" strokeWidth={2} />
          <ellipse cx={x} cy={y + h / 2} rx={6.5} ry={h / 2} fill="#6FB04A" stroke="#3E7A2A" strokeWidth={2.5} />
          <path d={`M${x - 2},${y + 5} v${h - 10} M${x + 2.5},${y + 6} v${h - 12}`} stroke="#9CCB6A" strokeWidth={1.5} strokeDasharray="2 3" />
        </g>
      ))}
    </>
  ),
  // A small tree of shikuwasa, the island's sour green citrus
  shikuwasa: (
    <>
      {trunk(50, 64, 9)}
      <ellipse cx={50} cy={44} rx={36} ry={30} fill="#3E8F4A" stroke="#2A5B36" strokeWidth={3} />
      <ellipse cx={38} cy={34} rx={14} ry={10} fill="#4FA35A" />
      <g fill="#9CCB3B" stroke="#5E7F1E" strokeWidth={2}>
        <circle cx={28} cy={50} r={5} />
        <circle cx={44} cy={26} r={5} />
        <circle cx={62} cy={36} r={5} />
        <circle cx={70} cy={56} r={5} />
        <circle cx={50} cy={58} r={5} />
        <circle cx={34} cy={36} r={4.5} />
      </g>
      <g fill="#E3D34A" stroke="#8A7E1E" strokeWidth={2}>
        <circle cx={58} cy={48} r={5} />
        <circle cx={76} cy={40} r={4.5} />
      </g>
    </>
  ),
  // An open box of chinsuko, Okinawa's shortbread
  chinsukoBox: (
    <>
      <rect x={20} y={8} width={64} height={44} rx={4} fill="#C8452F" stroke="#7A2214" strokeWidth={3} transform="rotate(-8 52 30)" />
      <rect x={30} y={18} width={44} height={16} rx={3} fill="#F4E6C8" stroke="#7A2214" strokeWidth={2} transform="rotate(-8 52 26)" />
      <path d="M36,27 h32" stroke="#E2703A" strokeWidth={3} strokeLinecap="round" transform="rotate(-8 52 27)" />
      <path d="M8,56 L92,56 L86,70 L14,70 Z" fill="#F4E6C8" stroke="#7A2214" strokeWidth={3} strokeLinejoin="round" />
      <g fill="#EBC98A" stroke="#A87A3A" strokeWidth={2}>
        <rect x={16} y={56} width={21} height={10} rx={4} />
        <rect x={40} y={56} width={21} height={10} rx={4} />
        <rect x={64} y={56} width={21} height={10} rx={4} />
        <rect x={19} y={47} width={19} height={10} rx={4} />
        <rect x={41} y={47} width={19} height={10} rx={4} />
        <rect x={63} y={47} width={19} height={10} rx={4} />
      </g>
      <path
        d="M22,58 v6 M26.5,58 v6 M31,58 v6 M46,58 v6 M50.5,58 v6 M55,58 v6 M70,58 v6 M74.5,58 v6 M79,58 v6 M24,49 v6 M28.5,49 v6 M33,49 v6 M46,49 v6 M50.5,49 v6 M55,49 v6 M68,49 v6 M72.5,49 v6 M77,49 v6"
        stroke="#C99A52"
        strokeWidth={1.5}
      />
      <path d="M8,68 L92,68 L88,97 L12,97 Z" fill="#C8452F" stroke="#7A2214" strokeWidth={3} strokeLinejoin="round" />
      <path d="M11,76 H89" stroke="#E8B83A" strokeWidth={3} />
      <circle cx={50} cy={86} r={6} fill="#F4E6C8" stroke="#7A2214" strokeWidth={2} />
    </>
  ),
  // Beni-imo, the purple sweet potato, one cut open
  imo: (
    <>
      <path d="M8,86 C6,72 22,62 40,66 C52,68 60,78 56,88 C52,96 20,98 8,86 Z" fill="#7B3F8C" stroke="#43204F" strokeWidth={3} strokeLinejoin="round" />
      <path d="M44,74 C46,56 66,46 82,54 C94,60 94,76 84,84 C72,92 46,90 44,74 Z" fill="#8E4A9E" stroke="#43204F" strokeWidth={3} strokeLinejoin="round" />
      <path d="M8,86 L2,90 M84,84 L92,90 M82,54 L88,48" stroke="#43204F" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M20,74 q4,-2 8,0 M62,62 q4,-2 8,0 M66,78 q4,-2 7,0" stroke="#B57AC4" strokeWidth={2} fill="none" strokeLinecap="round" />
      <ellipse cx={36} cy={46} rx={16} ry={12} fill="#7B3F8C" stroke="#43204F" strokeWidth={3} transform="rotate(-20 36 46)" />
      <ellipse cx={36} cy={46} rx={12} ry={8.5} fill="#C985DC" transform="rotate(-20 36 46)" />
      <ellipse cx={36} cy={46} rx={6} ry={4} fill="#DDA8EA" transform="rotate(-20 36 46)" />
    </>
  ),
  // Kokuto, the dark sugar boiled down from sugarcane, in chunks in a wooden bowl
  sugarBowl: (
    <>
      <g fill="#5E3A1E" stroke="#3A2210" strokeWidth={2.5} strokeLinejoin="round">
        <path d="M24,62 L28,46 L42,44 L46,58 L38,66 Z" />
        <path d="M44,60 L46,40 L60,36 L66,50 L58,64 Z" />
        <path d="M60,62 L66,48 L78,50 L80,62 Z" />
        <path d="M34,64 L40,52 L52,56 L50,66 Z" />
      </g>
      <g fill="#8A5A33">
        <path d="M30,48 L36,47 L33,54 Z" />
        <path d="M49,42 L56,39 L52,47 Z" />
        <path d="M68,51 L73,51 L70,56 Z" />
      </g>
      <path d="M12,64 Q14,93 50,95 Q86,93 88,64 Z" fill="#C49A62" stroke="#7A5230" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={64} rx={38} ry={7} fill="#D9B27A" stroke="#7A5230" strokeWidth={3} />
      <path d="M22,76 Q50,84 78,76" stroke="#A87A44" strokeWidth={2} fill="none" />
    </>
  ),
  // A plate of sata andagi, the round fried doughnuts that crack open as they fry
  sataandagi: (
    <>
      <ellipse cx={50} cy={87} rx={44} ry={10} fill="#F4F0E8" stroke="#6B7F86" strokeWidth={3} />
      <ellipse cx={50} cy={86} rx={32} ry={6} fill="#E3E8E6" />
      {[
        [27, 74],
        [50, 76],
        [73, 74],
        [38, 54],
        [62, 54],
      ].map(([x, y]) => (
        <g key={`${x},${y}`}>
          <circle cx={x} cy={y} r={13} fill="#C9873A" stroke="#7A4A1A" strokeWidth={2.5} />
          <path
            d={`M${x - 8},${y - 5} Q${x},${y - 1} ${x + 8},${y - 6} Q${x + 2},${y - 12} ${x - 8},${y - 5} Z`}
            fill="#F2CB82"
            stroke="#B57A36"
            strokeWidth={1.5}
          />
        </g>
      ))}
    </>
  ),
  // Rare: a mango tree hung with golden mangoes
  mango: (
    <>
      {trunk(50, 62, 11)}
      <path d="M50,70 L36,58 M52,68 L66,58" stroke="#43260F" strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={50} cy={40} rx={40} ry={30} fill="#2F7A44" stroke="#1E5530" strokeWidth={3} />
      <ellipse cx={36} cy={30} rx={15} ry={10} fill="#3E8F55" />
      <ellipse cx={64} cy={34} rx={12} ry={8} fill="#3E8F55" />
      {[
        [30, 56],
        [48, 62],
        [66, 54],
        [58, 38],
        [38, 40],
      ].map(([x, y]) => (
        <g key={`${x},${y}`}>
          <path d={`M${x},${y - 9} V${y - 6}`} stroke="#1E5530" strokeWidth={2} />
          <ellipse cx={x} cy={y} rx={6} ry={8} fill="#F2B33D" stroke="#9A6512" strokeWidth={2} transform={`rotate(-12 ${x} ${y})`} />
          <ellipse cx={x + 2} cy={y + 2} rx={3} ry={4} fill="#E2703A" opacity={0.7} />
        </g>
      ))}
      <Sparks a={[12, 16]} b={[90, 22]} />
    </>
  ),

  // ---------- 祭典 ----------
  // A round paper lantern in red, white and blue panels running top to bottom, as hung outside shops and at festivals
  // all over Okinawa
  lantern: (
    <>
      <path d="M50,0 V11" stroke="#3B2A1E" strokeWidth={3} />
      <ellipse cx={50} cy={46} rx={37} ry={32} fill="#2D5FA8" />
      <ellipse cx={50} cy={46} rx={28} ry={32} fill="#FAF7F0" />
      <ellipse cx={50} cy={46} rx={17} ry={32} fill="#D9412E" />
      <ellipse cx={50} cy={46} rx={6} ry={32} fill="#FAF7F0" />
      <path
        d="M15,34 Q50,40 85,34 M14,46 Q50,52 86,46 M15,58 Q50,64 85,58 M20,24 Q50,29 80,24 M20,68 Q50,73 80,68"
        stroke="#173944"
        strokeWidth={1.2}
        opacity={0.25}
        fill="none"
      />
      <ellipse cx={50} cy={46} rx={37} ry={32} fill="none" stroke="#5E5A52" strokeWidth={3} />
      <ellipse cx={33} cy={32} rx={5} ry={8} fill="#fff" opacity={0.45} transform="rotate(20 33 32)" />
      <rect x={36} y={9} width={28} height={8} rx={2} fill="#2F2A26" />
      <rect x={36} y={75} width={28} height={8} rx={2} fill="#2F2A26" />
      <circle cx={50} cy={86} r={3} fill="#D9412E" />
      <path d="M47,88 L45,98 M50,88 V98 M53,88 L55,98" stroke="#D9412E" strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  // Yotsudake: two bamboo clappers in each hand, clicked in Ryukyu dance
  yotsudake: (
    <>
      {[
        [34, -16],
        [66, 16],
      ].map(([x, a]) => (
        <g key={x} transform={`rotate(${a} ${x} 62)`}>
          <rect x={x - 9} y={36} width={11} height={50} rx={4} fill="#E3C27A" stroke="#8A6A2C" strokeWidth={2.5} />
          <rect x={x - 3} y={38} width={11} height={50} rx={4} fill="#EED493" stroke="#8A6A2C" strokeWidth={2.5} />
          <path d={`M${x - 3},52 h11 M${x - 3},72 h11`} stroke="#C9A55A" strokeWidth={2} />
          <path d={`M${x - 4},38 q2,-10 8,-12 q6,2 4,12`} fill="none" stroke="#D9412E" strokeWidth={2.5} />
          <path d={`M${x + 4},26 l-4,-10 M${x + 4},26 l2,-11 M${x + 4},26 l6,-8`} stroke="#D9412E" strokeWidth={2} strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  // A paranku, the small hand drum of eisa dancers, with its stick
  paranku: (
    <>
      <path d="M68,42 L94,16" stroke="#7A5230" strokeWidth={7} strokeLinecap="round" />
      <path d="M68,42 L94,16" stroke="#C49A62" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M14,60 L14,80 A36,14 0 0 0 86,80 L86,60 Z" fill="#C8452F" stroke="#7A2214" strokeWidth={3} strokeLinejoin="round" />
      <path d="M17,64 L27,82 L38,66 L50,86 L62,66 L73,82 L83,64" fill="none" stroke="#F4E6C8" strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={50} cy={60} rx={36} ry={14} fill="#F4E6C8" stroke="#7A2214" strokeWidth={3} />
      <ellipse cx={42} cy={56} rx={16} ry={4} fill="#fff" opacity={0.5} />
    </>
  ),
  // A hata-gashira, the decorated banner pole raised high at village festivals
  banner: (
    <>
      <path d="M36,97 H64" stroke="#5E4325" strokeWidth={5} strokeLinecap="round" />
      <path d="M50,96 V16" stroke="#5E4325" strokeWidth={6} strokeLinecap="round" />
      <path d="M50,96 V16" stroke="#B48A55" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M53,28 H76 V80 H53 Z" fill="#F4EAD5" stroke="#8A6A44" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M53,28 H76 V34 H53 Z M53,74 H76 V80 H53 Z" fill="#C8452F" />
      <path d="M60,42 h10 M58,50 h14 M61,58 h8 M59,66 h12" stroke="#2F2A26" strokeWidth={3} strokeLinecap="round" />
      <path d="M28,24 A22,22 0 0 1 72,24 Z" fill="#E8B83A" stroke="#8A6410" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M50,24 L33,12 M50,24 L42,5 M50,24 L58,5 M50,24 L67,12" stroke="#D9412E" strokeWidth={2.5} />
      <circle cx={50} cy={20} r={6} fill="#D9412E" stroke="#8A2015" strokeWidth={2} />
      <path d="M30,26 Q24,40 30,52 M70,26 Q78,38 72,48" stroke="#2D8FD0" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M34,26 Q30,36 36,44" stroke="#3E8F4A" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  ),
  // The big drum of eisa, on its stand
  taiko: (
    <>
      <path d="M24,98 L40,66 M76,98 L60,66" stroke="#5E4325" strokeWidth={6} strokeLinecap="round" />
      <circle cx={50} cy={52} r={34} fill="#C8452F" stroke="#7A2214" strokeWidth={3} />
      <circle cx={50} cy={52} r={27} fill="#F4E6C8" stroke="#7A2214" strokeWidth={2.5} />
      <g fill="#2F2A26">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={f1(50 + Math.cos(a) * 30.5)} cy={f1(52 + Math.sin(a) * 30.5)} r={1.8} />;
        })}
      </g>
      <ellipse cx={42} cy={42} rx={10} ry={5} fill="#fff" opacity={0.5} transform="rotate(-30 42 42)" />
      <path d="M74,24 L94,6" stroke="#7A5230" strokeWidth={7} strokeLinecap="round" />
      <path d="M74,24 L94,6" stroke="#C49A62" strokeWidth={3.5} strokeLinecap="round" />
    </>
  ),
  // The sanshin, Okinawa's three-stringed lute, the instrument of this game's music
  sanshinLute: (
    <g transform="rotate(-18 50 52)">
      <path d="M45,4 Q50,0 56,3 L55,10 L45,10 Z" fill="#2F2A26" />
      <rect x={45} y={8} width={10} height={60} fill="#2F2A26" />
      <g fill="#F4E6C8" stroke="#2F2A26" strokeWidth={1.5}>
        <rect x={38} y={12} width={8} height={3.5} rx={1.5} />
        <rect x={54} y={17} width={8} height={3.5} rx={1.5} />
        <rect x={38} y={22} width={8} height={3.5} rx={1.5} />
      </g>
      <rect x={28} y={60} width={44} height={36} rx={9} fill="#C8452F" stroke="#7A2214" strokeWidth={2.5} />
      <rect x={32} y={63} width={36} height={30} rx={6} fill="#A39470" stroke="#5E5236" strokeWidth={2} />
      <g fill="#7A6C4C">
        {[
          [38, 69],
          [48, 68],
          [58, 70],
          [42, 78],
          [54, 79],
          [62, 81],
          [37, 87],
          [48, 88],
          [58, 89],
        ].map(([x, y]) => (
          <path key={`${x},${y}`} d={`M${x},${y - 3} l3,1.5 v3 l-3,1.5 l-3,-1.5 v-3 Z`} />
        ))}
      </g>
      <path d="M48,8 V84 M50,8 V84 M52,8 V84" stroke="#F4F0E8" strokeWidth={0.9} />
      <rect x={43} y={82} width={14} height={4} rx={1} fill="#F4E6C8" stroke="#5E5236" strokeWidth={1} />
    </g>
  ),
  // A hanagasa, the big flower hat of Ryukyu dance
  flowerHat: (
    <>
      <path d="M24,80 Q28,94 40,97 M76,80 Q72,94 60,97" stroke="#D9412E" strokeWidth={2.5} fill="none" />
      <ellipse cx={50} cy={74} rx={44} ry={12} fill="#2D5FA8" stroke="#173944" strokeWidth={3} />
      <path d="M12,74 q6,-4 12,0 t12,0 t12,0 t12,0 t12,0 t12,0" stroke="#fff" strokeWidth={2} fill="none" />
      <g fill="#D9412E" stroke="#8A2015" strokeWidth={2.5} strokeLinejoin="round">
        <path d="M20,72 C14,56 24,44 34,50 C32,36 44,26 50,36 C56,26 68,36 66,50 C76,44 86,56 80,72 Z" />
      </g>
      <g fill="#F07A8A" stroke="#B5404F" strokeWidth={2} strokeLinejoin="round">
        <path d="M32,70 C30,58 38,52 44,58 C44,48 56,48 56,58 C62,52 70,58 68,70 Z" />
      </g>
      <circle cx={50} cy={62} r={5} fill="#F2C14E" stroke="#9A6512" strokeWidth={2} />
    </>
  ),
  // Rare: fireworks, which can go up in the sky behind the house
  fireworks: (
    <>
      <g stroke="#E8B83A" strokeWidth={4} strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <path key={i} d={`M${f1(50 + Math.cos(a) * 12)},${f1(52 + Math.sin(a) * 12)} L${f1(50 + Math.cos(a) * 36)},${f1(52 + Math.sin(a) * 36)}`} />;
        })}
      </g>
      <g stroke="#D9412E" strokeWidth={3} strokeLinecap="round">
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i + 0.5) / 12) * Math.PI * 2;
          return <path key={i} d={`M${f1(50 + Math.cos(a) * 16)},${f1(52 + Math.sin(a) * 16)} L${f1(50 + Math.cos(a) * 28)},${f1(52 + Math.sin(a) * 28)}`} />;
        })}
      </g>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={f1(50 + Math.cos(a) * 41)} cy={f1(52 + Math.sin(a) * 41)} r={3.5} fill={['#2D8FD0', '#F07A8A', '#3FA06A'][i % 3]} />;
      })}
      <circle cx={50} cy={52} r={6} fill="#FFF2B0" stroke="#E8B83A" strokeWidth={2} />
      <Sparks a={[16, 14]} b={[86, 88]} />
    </>
  ),

  // ---------- 動物 ----------
  // A house gecko on the wall; Okinawa's geckos chirp
  gecko: (
    <g transform="rotate(-25 50 50)" stroke="#4F7A2A" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50,58 C50,72 40,84 52,90 C60,94 66,86 60,82" fill="none" strokeWidth={9} />
      <path d="M50,58 C50,72 40,84 52,90 C60,94 66,86 60,82" fill="none" stroke="#A6CF6E" strokeWidth={5} />
      <path d="M44,38 L32,30 M56,38 L68,30 M44,56 L32,64 M56,56 L68,64" strokeWidth={6} />
      <path d="M44,38 L32,30 M56,38 L68,30 M44,56 L32,64 M56,56 L68,64" stroke="#A6CF6E" strokeWidth={3} />
      <g fill="#A6CF6E" strokeWidth={2}>
        <circle cx={31} cy={29} r={3.5} />
        <circle cx={69} cy={29} r={3.5} />
        <circle cx={31} cy={65} r={3.5} />
        <circle cx={69} cy={65} r={3.5} />
      </g>
      <ellipse cx={50} cy={47} rx={9} ry={15} fill="#A6CF6E" />
      <ellipse cx={50} cy={26} rx={9} ry={10} fill="#A6CF6E" />
      <circle cx={45} cy={23} r={2.4} fill="#173944" stroke="none" />
      <circle cx={55} cy={23} r={2.4} fill="#173944" stroke="none" />
    </g>
  ),
  cat: (
    <>
      <path d="M70,92 C86,92 90,76 82,68" fill="none" stroke="#8A5212" strokeWidth={9} strokeLinecap="round" />
      <path d="M70,92 C86,92 90,76 82,68" fill="none" stroke="#F0A44B" strokeWidth={5} strokeLinecap="round" />
      <path d="M30,97 C24,72 30,54 38,48 L62,48 C70,54 76,72 70,97 Z" fill="#F0A44B" stroke="#8A5212" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={76} rx={10} ry={16} fill="#FBE3C2" />
      <ellipse cx={43} cy={96} rx={6} ry={3.5} fill="#FBE3C2" stroke="#8A5212" strokeWidth={2} />
      <ellipse cx={57} cy={96} rx={6} ry={3.5} fill="#FBE3C2" stroke="#8A5212" strokeWidth={2} />
      <path
        d="M30,24 L34,8 L44,18 L56,18 L66,8 L70,24 C76,36 70,52 50,52 C30,52 24,36 30,24 Z"
        fill="#F0A44B"
        stroke="#8A5212"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M35,14 L37,22 L41,18 Z M65,14 L63,22 L59,18 Z" fill="#F7C6B0" />
      <path d="M44,22 l2,6 M50,21 v7 M56,22 l-2,6" stroke="#C47A22" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M39,34 q4,-4 8,0 M53,34 q4,-4 8,0" stroke="#3B2410" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <path d="M48,39 h4 l-2,3 Z" fill="#D45B6B" />
      <path d="M50,42 q-3,3 -6,1 M50,42 q3,3 6,1" stroke="#3B2410" strokeWidth={2} fill="none" />
    </>
  ),
  // The paper kite butterfly: big white wings with black veins and spots, floating slowly
  butterfly: (
    <>
      <g fill="#FBFBF4" stroke="#2B2B2B" strokeWidth={2.5} strokeLinejoin="round">
        <path d="M49,50 C34,20 8,18 6,38 C6,54 28,57 49,55 Z" />
        <path d="M51,50 C66,20 92,18 94,38 C94,54 72,57 51,55 Z" />
        <path d="M49,56 C30,60 16,78 26,90 C36,98 46,76 49,60 Z" />
        <path d="M51,56 C70,60 84,78 74,90 C64,98 54,76 51,60 Z" />
      </g>
      <g stroke="#2B2B2B" strokeWidth={1.5} fill="none">
        <path d="M48,52 L22,30 M48,53 L14,44 M48,58 L30,80 M52,52 L78,30 M52,53 L86,44 M52,58 L70,80" />
      </g>
      <g fill="#2B2B2B">
        <circle cx={22} cy={40} r={3.5} />
        <circle cx={32} cy={28} r={2.5} />
        <circle cx={14} cy={30} r={2.5} />
        <circle cx={78} cy={40} r={3.5} />
        <circle cx={68} cy={28} r={2.5} />
        <circle cx={86} cy={30} r={2.5} />
        <circle cx={34} cy={74} r={3} />
        <circle cx={66} cy={74} r={3} />
        <circle cx={28} cy={86} r={2} />
        <circle cx={72} cy={86} r={2} />
      </g>
      <ellipse cx={50} cy={58} rx={3.5} ry={16} fill="#2B2B2B" />
      <circle cx={50} cy={41} r={4} fill="#2B2B2B" />
      <path d="M49,38 C46,28 40,24 36,26 M51,38 C54,28 60,24 64,26" stroke="#2B2B2B" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  // A white goat, kept by many Okinawan families
  goat: (
    <>
      <path d="M22,52 q-8,-6 -6,-14" stroke="#6E6A62" strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d="M22,52 q-8,-6 -6,-14" stroke="#F4F0E6" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      {[26, 36, 58, 68].map((x) => (
        <g key={x}>
          <rect x={x - 3.5} y={62} width={7} height={33} rx={3} fill="#F4F0E6" stroke="#6E6A62" strokeWidth={2.5} />
          <rect x={x - 3.5} y={91} width={7} height={6} rx={2} fill="#4A4540" />
        </g>
      ))}
      <ellipse cx={46} cy={58} rx={28} ry={16} fill="#F4F0E6" stroke="#6E6A62" strokeWidth={3} />
      <path d="M66,52 L74,36" stroke="#F4F0E6" strokeWidth={14} strokeLinecap="round" />
      <path d="M72,30 C68,18 58,16 56,24" stroke="#B9A88A" strokeWidth={5} fill="none" strokeLinecap="round" />
      <ellipse cx={80} cy={36} rx={12} ry={9} fill="#F4F0E6" stroke="#6E6A62" strokeWidth={3} transform="rotate(25 80 36)" />
      <path d="M70,32 L60,36 L68,40 Z" fill="#E8E2D2" stroke="#6E6A62" strokeWidth={2} strokeLinejoin="round" />
      <path d="M86,44 L86,54 L82,46 Z" fill="#E8E2D2" stroke="#6E6A62" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={80} cy={33} r={2} fill="#2F2A26" />
      <path d="M90,40 q2,1 1,3" stroke="#6E6A62" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  // An Agu, Okinawa's own black pig
  agu: (
    <>
      <path d="M14,58 q-8,-2 -6,-10 q4,4 6,0" stroke="#1E1A1B" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {[24, 36, 56, 66].map((x) => (
        <rect key={x} x={x - 4} y={74} width={8} height={22} rx={3} fill="#3A3436" stroke="#1E1A1B" strokeWidth={2.5} />
      ))}
      <ellipse cx={44} cy={62} rx={32} ry={22} fill="#3A3436" stroke="#1E1A1B" strokeWidth={3} />
      <path d="M22,70 Q44,80 66,70" stroke="#5A5254" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={74} cy={54} r={16} fill="#3A3436" stroke="#1E1A1B" strokeWidth={3} />
      <path d="M66,40 L70,30 L78,40 Z" fill="#5A5254" stroke="#1E1A1B" strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={88} cy={58} rx={6} ry={7} fill="#E79AA6" stroke="#8A4A55" strokeWidth={2} />
      <path d="M86,56 v4 M90,56 v4" stroke="#8A4A55" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={76} cy={49} r={3} fill="#fff" />
      <circle cx={77} cy={49} r={1.6} fill="#1E1A1B" />
    </>
  ),
  // A hen
  chicken: (
    <>
      <path d="M44,80 V94 M58,80 V94 M40,96 h8 M54,96 h8" stroke="#E8A33A" strokeWidth={3} strokeLinecap="round" />
      <path d="M26,58 C14,48 16,30 26,28 C28,40 32,46 36,50 Z" fill="#F4F0E6" stroke="#6E6A62" strokeWidth={2.5} strokeLinejoin="round" />
      <ellipse cx={50} cy={64} rx={26} ry={20} fill="#FFFFFF" stroke="#6E6A62" strokeWidth={3} />
      <path d="M40,60 Q50,70 62,62" stroke="#D8D2C6" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <circle cx={70} cy={42} r={12} fill="#FFFFFF" stroke="#6E6A62" strokeWidth={3} />
      <path d="M62,32 L64,24 L68,30 L71,22 L74,30 L78,26 L77,34 Z" fill="#D9412E" stroke="#8A2015" strokeWidth={2} strokeLinejoin="round" />
      <path d="M81,42 L90,45 L81,48 Z" fill="#F2B33D" stroke="#9A6512" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M79,50 q3,6 -1,8 q-3,-3 -1,-8 Z" fill="#D9412E" stroke="#8A2015" strokeWidth={1.5} />
      <circle cx={74} cy={40} r={2} fill="#2F2A26" />
    </>
  ),
  // A mejiro, the small green bird with a white ring round its eye, on a twig
  mejiro: (
    <>
      <path d="M6,82 Q50,74 94,80" stroke="#7A5230" strokeWidth={5} fill="none" strokeLinecap="round" />
      <ellipse cx={80} cy={72} rx={8} ry={4} fill="#4E9A4A" stroke="#2F6A35" strokeWidth={2} transform="rotate(-30 80 72)" />
      <path d="M30,64 L10,58 L14,68 Z" fill="#7F9A2E" stroke="#4E5E1E" strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={46} cy={62} rx={20} ry={15} fill="#9CB83A" stroke="#4E5E1E" strokeWidth={3} />
      <path d="M38,70 Q48,78 60,68" stroke="#E8E0B8" strokeWidth={6} fill="none" strokeLinecap="round" />
      <circle cx={62} cy={48} r={12} fill="#9CB83A" stroke="#4E5E1E" strokeWidth={3} />
      <path d="M58,58 Q64,62 70,56" stroke="#E8D23A" strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={65} cy={46} r={5} fill="#FFFFFF" />
      <circle cx={66} cy={46} r={2.5} fill="#2F2A26" />
      <path d="M73,48 L80,49 L73,51 Z" fill="#3A3436" />
      <path d="M44,77 L42,82 M52,77 L52,82" stroke="#6E6A62" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M40,58 q6,-4 12,0" stroke="#7F9A2E" strokeWidth={2} fill="none" />
    </>
  ),
  // Rare: the golden chrysalis of the paper kite butterfly, hanging from a twig
  goldPupa: (
    <>
      <path d="M8,14 Q50,8 92,16" stroke="#7A5230" strokeWidth={5} fill="none" strokeLinecap="round" />
      <ellipse cx={74} cy={22} rx={12} ry={6} fill="#4E9A4A" stroke="#2F6A35" strokeWidth={2} transform="rotate(20 74 22)" />
      <path d="M50,12 V22" stroke="#C9B48E" strokeWidth={2} />
      <path
        d="M50,22 C66,26 70,50 62,68 C58,78 54,86 50,92 C46,86 42,78 38,68 C30,50 34,26 50,22 Z"
        fill="#E8B83A"
        stroke="#8A6410"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M42,36 Q40,52 46,70" stroke="#FFF0B0" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M38,48 Q50,52 62,48" stroke="#8A6410" strokeWidth={2} fill="none" />
      <g fill="#2B2B2B">
        <circle cx={41} cy={46} r={1.6} />
        <circle cx={47} cy={47.5} r={1.6} />
        <circle cx={53} cy={47.5} r={1.6} />
        <circle cx={59} cy={46} r={1.6} />
      </g>
      <Sparks a={[22, 44]} b={[78, 66]} />
    </>
  ),

  // ---------- 工藝 ----------
  // A Ryukyu glass tumbler, blue at the rim and green at the foot, full of little bubbles
  glassCup: (
    <>
      <path d="M26,26 L74,26 L67,96 L33,96 Z" fill="#4FB6CF" />
      <path d="M29.4,60 L70.6,60 L67,96 L33,96 Z" fill="#2E8F6E" />
      <path d="M26,26 L74,26 L67,96 L33,96 Z" fill="none" stroke="#1E5E6A" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={26} rx={24} ry={5.5} fill="#BDEAF5" stroke="#1E5E6A" strokeWidth={3} />
      <path d="M35,36 L38,86" stroke="#fff" strokeWidth={4} opacity={0.45} strokeLinecap="round" />
      <g fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.75}>
        <circle cx={56} cy={52} r={3} />
        <circle cx={61} cy={66} r={2} />
        <circle cx={52} cy={74} r={2.5} />
        <circle cx={46} cy={60} r={1.8} />
      </g>
    </>
  ),
  // A Tsuboya pottery vase from Naha, painted with a red flower
  vase: (
    <>
      <path
        d="M38,22 L62,22 L60,32 C82,42 84,72 70,90 L66,97 L34,97 L30,90 C16,72 18,42 40,32 Z"
        fill="#F2E6CF"
        stroke="#6B4A2B"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <rect x={33} y={14} width={34} height={9} rx={3} fill="#E9DCC2" stroke="#6B4A2B" strokeWidth={3} />
      <path d="M27,44 C42,50 58,50 73,44" stroke="#2F6FA8" strokeWidth={4} fill="none" />
      <path d="M26,86 C42,91 58,91 74,86" stroke="#2F6FA8" strokeWidth={4} fill="none" />
      <path d="M36,74 C40,62 46,58 50,66 M64,74 C60,62 54,58 50,66" stroke="#3F8A5A" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={39} cy={70} rx={6} ry={3.5} fill="#3F8A5A" transform="rotate(-35 39 70)" />
      <ellipse cx={61} cy={70} rx={6} ry={3.5} fill="#3F8A5A" transform="rotate(35 61 70)" />
      <g fill="#D9533A" stroke="#9A2E1C" strokeWidth={1.5}>
        <circle cx={50} cy={54} r={5} />
        <circle cx={56} cy={58} r={5} />
        <circle cx={54} cy={65} r={5} />
        <circle cx={46} cy={65} r={5} />
        <circle cx={44} cy={58} r={5} />
      </g>
      <circle cx={50} cy={60} r={3} fill="#F2C14E" />
    </>
  ),
  // A shop curtain of bingata, Okinawa's brightly dyed cloth
  curtain: (
    <>
      {[10, 38, 66].map((x, i) => (
        <g key={x}>
          <path d={`M${x},12 H${x + 25} V94 H${x} Z`} fill="#F2C14E" stroke="#8A6410" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={`M${x},82 H${x + 25} V94 H${x} Z`} fill="#2F6FA8" />
          <path d={`M${x + 2},88 q3,-3 6,0 t6,0 t6,0`} stroke="#fff" strokeWidth={1.5} fill="none" />
          <g transform={`translate(${x + 12.5},${i % 2 ? 56 : 38})`}>
            <g fill="#D9412E" stroke="#8A2015" strokeWidth={1.2}>
              <circle cx={0} cy={-5} r={4} />
              <circle cx={5} cy={-1} r={4} />
              <circle cx={3} cy={5} r={4} />
              <circle cx={-3} cy={5} r={4} />
              <circle cx={-5} cy={-1} r={4} />
            </g>
            <circle cx={0} cy={0} r={2.5} fill="#2F6FA8" />
          </g>
          <ellipse cx={x + 7} cy={i % 2 ? 34 : 64} rx={5} ry={2.5} fill="#3F8A5A" transform={`rotate(-30 ${x + 7} ${i % 2 ? 34 : 64})`} />
          <ellipse cx={x + 18} cy={i % 2 ? 72 : 22} rx={5} ry={2.5} fill="#3F8A5A" transform={`rotate(30 ${x + 18} ${i % 2 ? 72 : 22})`} />
        </g>
      ))}
      <path d="M5,11 H95" stroke="#5E4325" strokeWidth={6} strokeLinecap="round" />
      <path d="M5,11 H95" stroke="#9C7443" strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  // A floor cushion covered in bashofu, the banana-fibre cloth
  cushion: (
    <>
      <path d="M8,70 L8,78 L42,94 L42,86 Z" fill="#BFA77A" stroke="#7A6440" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M42,86 L92,70 L92,78 L42,94 Z" fill="#CDB68A" stroke="#7A6440" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M8,70 L58,54 L92,70 L42,86 Z" fill="#E3D2A6" stroke="#7A6440" strokeWidth={3} strokeLinejoin="round" />
      <path d="M17,73 L67,57 M25,77 L75,61 M33,81 L83,65" stroke="#3B4F7A" strokeWidth={2} />
      <path d="M26,64 L60,80 M40,60 L74,76" stroke="#3B4F7A" strokeWidth={1.5} strokeDasharray="3 4" />
      <path d="M8,70 l-4,4 M92,70 l4,4 M58,54 l0,-5 M42,94 l0,4" stroke="#D9412E" strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  // A round box of red Ryukyu lacquer with gold flowers
  lacquer: (
    <>
      <path d="M18,60 L18,86 A32,10 0 0 0 82,86 L82,60 Z" fill="#A8202A" stroke="#5E1214" strokeWidth={3} strokeLinejoin="round" />
      <path d="M18,72 Q50,82 82,72" stroke="#E8B83A" strokeWidth={2} fill="none" />
      <path d="M14,48 L14,58 A36,11 0 0 0 86,58 L86,48 Z" fill="#C8302F" stroke="#5E1214" strokeWidth={3} strokeLinejoin="round" />
      <ellipse cx={50} cy={48} rx={36} ry={11} fill="#D9433A" stroke="#5E1214" strokeWidth={3} />
      <g fill="none" stroke="#E8B83A" strokeWidth={2}>
        <ellipse cx={50} cy={48} rx={7} ry={3} />
        <ellipse cx={38} cy={47} rx={6} ry={2.5} />
        <ellipse cx={62} cy={47} rx={6} ry={2.5} />
        <path d="M30,50 q20,6 40,0" />
      </g>
      <ellipse cx={34} cy={44} rx={8} ry={2} fill="#fff" opacity={0.35} />
    </>
  ),
  // A wooden loom with indigo kasuri cloth half woven
  loom: (
    <>
      <rect x={12} y={14} width={7} height={84} rx={2} fill="#9C7443" stroke="#5E4325" strokeWidth={2.5} />
      <rect x={81} y={14} width={7} height={84} rx={2} fill="#9C7443" stroke="#5E4325" strokeWidth={2.5} />
      <path
        d="M24,20 V52 M30,20 V52 M36,20 V52 M42,20 V52 M48,20 V52 M54,20 V52 M60,20 V52 M66,20 V52 M72,20 V52 M76,20 V52"
        stroke="#E8DFC8"
        strokeWidth={1.8}
      />
      <rect x={20} y={54} width={60} height={26} fill="#2F4F8A" stroke="#1E3360" strokeWidth={2} />
      <g stroke="#E8DFC8" strokeWidth={2}>
        <path d="M28,60 v5 M25.5,62.5 h5 M46,60 v5 M43.5,62.5 h5 M64,60 v5 M61.5,62.5 h5" />
        <path d="M37,70 v5 M34.5,72.5 h5 M55,70 v5 M52.5,72.5 h5 M73,70 v5 M70.5,72.5 h5" />
      </g>
      <rect x={8} y={12} width={84} height={7} rx={2} fill="#B48A55" stroke="#5E4325" strokeWidth={2.5} />
      <rect x={10} y={50} width={80} height={5} rx={2} fill="#B48A55" stroke="#5E4325" strokeWidth={2} />
      <rect x={10} y={80} width={80} height={6} rx={2} fill="#B48A55" stroke="#5E4325" strokeWidth={2} />
      <path d="M34,46 Q50,38 66,46 Q50,52 34,46 Z" fill="#C49A62" stroke="#5E4325" strokeWidth={2} />
    </>
  ),
  // A folding fan painted with bingata flowers
  fan: (
    <>
      <path d="M50,92 L12,58 A50,50 0 0 1 88,58 Z" fill="#F2C14E" stroke="#8A6410" strokeWidth={3} strokeLinejoin="round" />
      <path d="M50,92 L30,72 A26,26 0 0 1 70,72 Z" fill="#FBF3E0" stroke="#8A6410" strokeWidth={2} strokeLinejoin="round" />
      <g stroke="#B48A30" strokeWidth={1.5}>
        <path d="M50,92 L20,52 M50,92 L31,45 M50,92 L44,42 M50,92 L56,42 M50,92 L69,45 M50,92 L80,52" />
      </g>
      <g fill="#D9412E" stroke="#8A2015" strokeWidth={1.2}>
        <circle cx={32} cy={56} r={5} />
        <circle cx={66} cy={52} r={5} />
      </g>
      <g fill="#2F6FA8">
        <circle cx={32} cy={56} r={2} />
        <circle cx={66} cy={52} r={2} />
        <circle cx={50} cy={48} r={3.5} />
      </g>
      <ellipse cx={42} cy={60} rx={5} ry={2.5} fill="#3F8A5A" transform="rotate(-40 42 60)" />
      <ellipse cx={58} cy={60} rx={5} ry={2.5} fill="#3F8A5A" transform="rotate(40 58 60)" />
      <circle cx={50} cy={92} r={3.5} fill="#8A6410" />
      <path d="M50,94 Q46,97 44,98" stroke="#D9412E" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </>
  ),
  // Rare: a hanging lamp of Ryukyu glass in blue, green and amber
  glassLamp: (
    <>
      <path d="M50,0 V18" stroke="#8A6410" strokeWidth={3} strokeDasharray="4 2" />
      <rect x={42} y={16} width={16} height={7} rx={2} fill="#E8B83A" stroke="#8A6410" strokeWidth={2} />
      <ellipse cx={50} cy={74} rx={20} ry={12} fill="#FFF2B0" opacity={0.7} />
      <path d="M18,64 C18,38 32,23 50,23 C68,23 82,38 82,64 Z" fill="#3AA8C8" />
      <path d="M18,64 C18,38 32,23 50,23 C42,30 38,46 38,64 Z" fill="#E8A33A" />
      <path d="M82,64 C82,38 68,23 50,23 C58,30 62,46 62,64 Z" fill="#3FA06A" />
      <path d="M18,64 C18,38 32,23 50,23 C68,23 82,38 82,64 Z" fill="none" stroke="#1E5E6A" strokeWidth={3} strokeLinejoin="round" />
      <g fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.8}>
        <circle cx={30} cy={48} r={2.5} />
        <circle cx={48} cy={38} r={2} />
        <circle cx={68} cy={52} r={2.5} />
        <circle cx={56} cy={56} r={1.8} />
      </g>
      <path d="M28,36 Q24,46 24,58" stroke="#fff" strokeWidth={3} opacity={0.5} fill="none" strokeLinecap="round" />
      <ellipse cx={50} cy={64} rx={33} ry={6} fill="#E8B83A" stroke="#8A6410" strokeWidth={2.5} />
      <Sparks a={[14, 24]} b={[88, 82]} />
    </>
  ),

  // ---------- 離島 ----------
  palm: (
    <>
      <path d="M56,97 C50,75 44,52 50,30" fill="none" stroke="#5E4325" strokeWidth={12} strokeLinecap="round" />
      <path d="M56,97 C50,75 44,52 50,30" fill="none" stroke="#9C7443" strokeWidth={7} strokeLinecap="round" />
      <path d="M48,84 h10 M45,70 h10 M45,56 h9 M47,43 h8" stroke="#5E4325" strokeWidth={2.5} strokeLinecap="round" />
      <g fill="#4E9A4A" stroke="#2F6A35" strokeWidth={2.5} strokeLinejoin="round">
        <path d="M50,28 C34,26 20,36 16,52 C26,40 38,34 50,30 Z" />
        <path d="M50,28 C66,26 80,36 84,52 C74,40 62,34 50,30 Z" />
        <path d="M50,28 C38,14 20,14 8,26 C24,22 36,24 50,30 Z" />
        <path d="M50,28 C62,14 80,14 92,26 C76,22 64,24 50,30 Z" />
        <path d="M50,28 C46,16 52,6 62,2 C56,12 54,20 51,29 Z" />
      </g>
      <g fill="#7A5230" stroke="#43260F" strokeWidth={2}>
        <circle cx={46} cy={33} r={4.5} />
        <circle cx={55} cy={34} r={4.5} />
        <circle cx={50} cy={38} r={4.5} />
      </g>
    </>
  ),
  // A bottle of star sand from the beaches of the Yaeyama islands
  starSand: (
    <>
      <rect x={40} y={8} width={20} height={14} rx={3} fill="#C9A26B" stroke="#7A5A2C" strokeWidth={3} />
      <path
        d="M42,22 L42,32 C30,38 30,46 30,52 L30,88 Q30,97 38,97 L62,97 Q70,97 70,88 L70,52 C70,46 70,38 58,32 L58,22 Z"
        fill="#DDF3F7"
        fillOpacity={0.85}
        stroke="#4E8A99"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M32,72 Q50,66 68,72 L68,88 Q68,95 62,95 L38,95 Q32,95 32,88 Z" fill="#F1DFAE" />
      <g fill="#E8B83A" stroke="#A9770F" strokeWidth={1}>
        <path d="M41,77 l1.5,3.5 3.5,.5 -2.6,2.4 .7,3.6 -3.1,-1.8 -3.1,1.8 .7,-3.6 -2.6,-2.4 3.5,-.5 Z" />
        <path d="M54,73 l1.3,3 3.2,.4 -2.3,2.1 .6,3.2 -2.8,-1.6 -2.8,1.6 .6,-3.2 -2.3,-2.1 3.2,-.4 Z" />
        <path d="M61,82 l1.5,3.5 3.5,.5 -2.6,2.4 .7,3.6 -3.1,-1.8 -3.1,1.8 .7,-3.6 -2.6,-2.4 3.5,-.5 Z" />
        <path d="M48,85 l1.2,2.8 2.9,.4 -2.1,1.9 .5,2.9 -2.5,-1.4 -2.5,1.4 .5,-2.9 -2.1,-1.9 2.9,-.4 Z" />
      </g>
      <path d="M36,48 v20" stroke="#fff" strokeWidth={3} opacity={0.7} strokeLinecap="round" />
    </>
  ),
  // A white lighthouse on its rock
  lighthouse: (
    <>
      <path d="M8,42 L40,22 M92,42 L60,22" stroke="#FFE27A" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <path d="M16,98 Q18,86 34,84 L66,84 Q82,86 84,98 Z" fill="#8C9A9E" stroke="#4F5D62" strokeWidth={3} strokeLinejoin="round" />
      <path d="M38,85 L42,30 L58,30 L62,85 Z" fill="#FAF7F0" stroke="#6E6A62" strokeWidth={3} strokeLinejoin="round" />
      <path d="M40.2,54 L59.8,54 L60.4,62 L39.6,62 Z" fill="#D9412E" />
      <path d="M46,85 V76 a4,4 0 0 1 8,0 V85" fill="#6B4A2B" />
      <rect x={34} y={26} width={32} height={5} rx={1} fill="#2F2A26" />
      <rect x={42} y={15} width={16} height={11} fill="#FFE27A" stroke="#2F2A26" strokeWidth={2.5} />
      <path d="M50,15 V26" stroke="#2F2A26" strokeWidth={1.5} />
      <path d="M39,15 L50,5 L61,15 Z" fill="#D9412E" stroke="#8A2015" strokeWidth={2.5} strokeLinejoin="round" />
    </>
  ),
  // A pot of white lilies, which fill Iejima in spring
  lily: (
    <>
      <path d="M50,62 C48,44 40,32 30,26 M50,62 C50,42 54,26 60,14 M52,62 C56,48 66,40 76,36" stroke="#3E8F4A" strokeWidth={3} fill="none" />
      <g fill="#5DAA55" stroke="#2F6A35" strokeWidth={1.5}>
        <path d="M48,54 C40,50 36,44 34,38 C40,42 44,46 48,50 Z" />
        <path d="M54,52 C62,50 66,46 70,42 C64,48 60,52 54,56 Z" />
      </g>
      {[
        [30, 26, -150],
        [60, 14, -100],
        [76, 36, -40],
      ].map(([x, y, a]) => (
        <g key={x} transform={`translate(${x},${y}) rotate(${a})`}>
          <path d="M0,0 L18,-5 Q24,-8 26,-3 Q24,0 26,3 Q24,8 18,5 Z" fill="#FFFFFF" stroke="#8A9A8C" strokeWidth={2} strokeLinejoin="round" />
          <path d="M2,0 L16,0" stroke="#C9E07A" strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      <path d="M28,64 L72,64 L66,98 L34,98 Z" fill="#2F6FA8" stroke="#1E3F6A" strokeWidth={3} strokeLinejoin="round" />
      <rect x={24} y={59} width={52} height={10} rx={4} fill="#3F82C0" stroke="#1E3F6A" strokeWidth={3} />
      <path d="M36,80 q4,-3 8,0 t8,0 t8,0" stroke="#BFD8F2" strokeWidth={2} fill="none" />
    </>
  ),
  // A water buffalo cart, the slow way round Taketomi's village
  buffaloCart: (
    <>
      <path d="M10,62 V40 M42,62 V40" stroke="#5E4325" strokeWidth={3} />
      <path d="M4,42 L48,42 L44,32 L8,32 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M12,36 a5,4 0 0 0 10,0 M24,36 a5,4 0 0 0 10,0" stroke="#F7E2C7" strokeWidth={1.5} fill="none" />
      <rect x={4} y={60} width={46} height={9} rx={2} fill="#9C7443" stroke="#5E4325" strokeWidth={2.5} />
      <path d="M48,66 L66,62" stroke="#5E4325" strokeWidth={3} />
      <circle cx={24} cy={82} r={14} fill="#B48A55" stroke="#5E4325" strokeWidth={3} />
      <path d="M24,68 V96 M10,82 H38 M14,72 L34,92 M34,72 L14,92" stroke="#5E4325" strokeWidth={2} />
      <circle cx={24} cy={82} r={4} fill="#5E4325" />
      {[62, 70, 80, 88].map((x) => (
        <rect key={x} x={x - 3} y={70} width={6} height={26} rx={2.5} fill="#6E6A70" stroke="#3A363C" strokeWidth={2} />
      ))}
      <ellipse cx={74} cy={64} rx={18} ry={12} fill="#6E6A70" stroke="#3A363C" strokeWidth={3} />
      <ellipse cx={90} cy={58} rx={7} ry={9} fill="#6E6A70" stroke="#3A363C" strokeWidth={2.5} />
      <path d="M86,50 C80,40 70,42 70,48 M93,50 C98,40 96,36 92,34" stroke="#E3DACA" strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={91} cy={56} r={1.8} fill="#1E1A1B" />
      <circle cx={84} cy={48} r={3.5} fill="#E8434F" />
      <circle cx={84} cy={48} r={1.4} fill="#F6C445" />
    </>
  ),
  // A Kerama deer fawn
  deer: (
    <>
      {[30, 38, 58, 66].map((x) => (
        <rect key={x} x={x - 2.5} y={62} width={5} height={34} rx={2} fill="#B9824A" stroke="#6B4422" strokeWidth={2} />
      ))}
      <ellipse cx={47} cy={58} rx={25} ry={13} fill="#B9824A" stroke="#6B4422" strokeWidth={3} />
      <path d="M22,52 q-6,-2 -6,-8" stroke="#6B4422" strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M22,52 q-6,-2 -6,-8" stroke="#F4F0E6" strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M66,52 L74,32" stroke="#B9824A" strokeWidth={11} strokeLinecap="round" />
      <ellipse cx={78} cy={28} rx={11} ry={8} fill="#B9824A" stroke="#6B4422" strokeWidth={3} transform="rotate(20 78 28)" />
      <path d="M70,22 L62,12 L72,18 Z M76,20 L76,8 L82,18 Z" fill="#B9824A" stroke="#6B4422" strokeWidth={2} strokeLinejoin="round" />
      <circle cx={88} cy={33} r={2.5} fill="#2F2A26" />
      <circle cx={79} cy={26} r={2.2} fill="#2F2A26" />
      <g fill="#F4E6CC">
        <circle cx={36} cy={52} r={2.2} />
        <circle cx={46} cy={50} r={2.2} />
        <circle cx={56} cy={52} r={2.2} />
        <circle cx={41} cy={58} r={2} />
        <circle cx={51} cy={58} r={2} />
      </g>
    </>
  ),
  // The ferry out to the islands
  ferry: (
    <>
      <path d="M4,90 q8,-5 16,0 t16,0 t16,0 t16,0 t16,0 t16,0 V98 H4 Z" fill="#3DA6CF" />
      <path d="M8,68 L92,68 L84,90 L16,90 Z" fill="#FAF7F0" stroke="#2B5E7A" strokeWidth={3} strokeLinejoin="round" />
      <path d="M10.6,76 L89.4,76 L88,80 L12,80 Z" fill="#2D7BC0" />
      <rect x={22} y={50} width={52} height={18} rx={3} fill="#FAF7F0" stroke="#2B5E7A" strokeWidth={3} />
      <g fill="#8FD3EE" stroke="#2B5E7A" strokeWidth={1.5}>
        {[27, 37, 47, 57, 66].map((x) => (
          <rect key={x} x={x} y={55} width={6} height={6} rx={2} />
        ))}
      </g>
      <rect x={36} y={38} width={26} height={12} rx={2} fill="#FAF7F0" stroke="#2B5E7A" strokeWidth={3} />
      <rect x={40} y={41} width={18} height={5} rx={2} fill="#8FD3EE" />
      <rect x={66} y={34} width={9} height={16} rx={2} fill="#D9412E" stroke="#8A2015" strokeWidth={2.5} />
    </>
  ),
  // Rare: a lamp showing the Southern Cross, seen from Hateruma, Japan's southernmost inhabited island
  southernCross: (
    <>
      <rect x={36} y={92} width={28} height={6} rx={2} fill="#5E4325" />
      <rect x={46} y={58} width={8} height={36} fill="#9C7443" stroke="#5E4325" strokeWidth={2} />
      <circle cx={50} cy={38} r={34} fill="#FFE27A" opacity={0.25} />
      <rect x={26} y={16} width={48} height={46} rx={6} fill="#1F3D73" stroke="#E8B83A" strokeWidth={3.5} />
      <path d="M22,18 L50,4 L78,18 Z" fill="#E8B83A" stroke="#8A6410" strokeWidth={2.5} strokeLinejoin="round" />
      <Star4 x={50} y={24} r={5} fill="#FFE27A" />
      <Star4 x={50} y={52} r={6.5} fill="#FFE27A" />
      <Star4 x={36} y={38} r={5} fill="#FFE27A" />
      <Star4 x={64} y={34} r={5.5} fill="#FFE27A" />
      <Star4 x={58} y={44} r={3} fill="#FFFFFF" />
      <Sparks a={[12, 40]} b={[88, 64]} />
    </>
  ),
};

/** A decoration's picture, in a 100 × 100 box */
export function DecorArt({ id }: { id: string }) {
  return <>{ART[id]}</>;
}

/** A decoration as its own picture */
export function DecorIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <DecorArt id={id} />
    </svg>
  );
}

/** Every decoration has art */
export const hasDecorArt = (id: string): boolean => id in ART;
