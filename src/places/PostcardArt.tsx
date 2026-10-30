// Okinawa's postcard picture, 400 × 240: the island chain between Taiwan and the main island, drawn in the game's
// palette. Every other postcard is an illustration (see `cardUrl`); this one also stands in if one of those can't load.

const FONT = 'GenSen Rounded TW, PingFang TC, sans-serif';

function Label({ x, y, text, size = 13 }: { x: number; y: number; text: string; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fill="#173944" stroke="#fff" strokeWidth={4} paintOrder="stroke" fontFamily={FONT}>
      {text}
    </text>
  );
}

/** 沖繩: the island chain between Taiwan and the main island, and the plane ride between them */
export function OkinawaMap() {
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
