import type { ReactNode } from 'react';

// The decorations of 西薩的家, drawn like the shisa: flat colours with a darker outline, each in a 100 × 100 box with
// its feet at the bottom. The white sticker edge comes from CSS, so the same art works in the drawer and in the yard.

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

const ART: Record<string, ReactNode> = {
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
