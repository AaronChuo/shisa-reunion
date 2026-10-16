import type { ReactNode } from 'react';
import type { CardKey } from '../content/zones';
import { C, M, Y0 } from '../game/geometry';
import { PieceArt } from './PieceArt';
import { GateArt, Sun, Urchin } from './Scene';
import { Star4 } from './Shisa';

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ICONS: Record<string, ReactNode> = {
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  soundOn: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  soundOff: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </>
  ),
  rot: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  next: <path d="M5 12h14M13 6l6 6-6 6" />,
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19V5M9 7h6" />
    </>
  ),
};

export type IconName = keyof typeof ICONS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...STROKE}>
      {ICONS[name]}
    </svg>
  );
}

export function CoinArt() {
  return (
    <>
      <circle cx={20} cy={20} r={18} fill="#F2B233" stroke="#A9770F" strokeWidth={3} />
      <circle cx={20} cy={20} r={12.5} fill="none" stroke="#FFE39A" strokeWidth={2} />
      <text x={20} y={26.5} textAnchor="middle" fontSize={17} fontWeight={700} fill="#7A5206" fontFamily="LXGW WenKai TC, PingFang TC, sans-serif">
        福
      </text>
    </>
  );
}

export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <CoinArt />
    </svg>
  );
}

export function ShellIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 34 C8 34 4 24 6 16 C9 8 15 5 20 5 C25 5 31 8 34 16 C36 24 32 34 20 34Z" fill="#FFC9B8" stroke="#C9614A" strokeWidth={2.5} />
      <path d="M20 33 L20 7 M20 33 L11 10 M20 33 L29 10 M20 33 L7 19 M20 33 L33 19" stroke="#C9614A" strokeWidth={1.8} />
    </svg>
  );
}

export function ConchIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M8 26 C6 16 14 6 26 6 C32 6 35 10 34 14 C33 18 28 18 26 22 C24 27 26 32 20 34 C14 36 9 32 8 26Z"
        fill="#F7E3C0"
        stroke="#A97E3E"
        strokeWidth={2.5}
      />
      <path d="M14 26 C14 18 20 12 28 11 M18 30 C18 24 22 18 30 16" stroke="#A97E3E" strokeWidth={1.8} fill="none" />
    </svg>
  );
}

/** A red travel stamp; pass x/y/size to place it inside another SVG */
export function Stamp({ label, mark, className, x, y, size }: { label: string; mark: string; className?: string; x?: number; y?: number; size?: number }) {
  return (
    <svg className={className} x={x} y={y} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <g transform="rotate(-10 60 60)" fill="#C8382B">
        <circle cx={60} cy={60} r={52} fill="none" stroke="#C8382B" strokeWidth={6} />
        <circle cx={60} cy={60} r={43} fill="none" stroke="#C8382B" strokeWidth={2} />
        <text x={60} y={55} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily="LXGW WenKai TC, PingFang TC, sans-serif">
          {label}
        </text>
        <text x={60} y={88} textAnchor="middle" fontSize={26} fontWeight={700} fontFamily="LXGW WenKai TC, PingFang TC, sans-serif">
          {mark}
        </text>
      </g>
    </svg>
  );
}

export type CardIconKey = CardKey | 'boss';

/** Small pictures for path cards, rule chips and first-time intros */
export function CardIcon({ k, className }: { k: CardIconKey; className?: string }) {
  const box = (vb: string, inner: ReactNode) => (
    <svg className={className} viewBox={vb} aria-hidden="true">
      {inner}
    </svg>
  );
  switch (k) {
    case 'urchin':
      return box('0 0 92 70', <Urchin cx={46} cy={40} />);
    case 'tide':
      return box(
        '0 0 92 70',
        <>
          <path d="M4,40 q11,-8 21,0 t21,0 t21,0 t21,0 V70 H4 Z" fill="#2EA6BE" fillOpacity={0.6} />
          <path d="M46,34 V8 M36,18 L46,8 L56,18" stroke="#1E7F95" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>,
      );
    case 'gate':
      return box(`${M - 12} ${Y0 - C - 28} 124 134`, <GateArt gate={{ x: 0, h: 1 }} open={false} />);
    case 'ladder':
      return box('-10 -10 120 220', <PieceArt t="ladder" o={0} />);
    case 'spring':
      return box('-8 -8 116 116', <PieceArt t="spring" o={0} />);
    case 'long':
      return box('-8 -30 316 160', <PieceArt t="long" o={0} />);
    case 'hard':
      return box(
        '0 0 92 70',
        <>
          <path d="M6,64 L34,18 L48,38 L60,26 L86,64 Z" fill="#8C7F6B" stroke="#4F463A" strokeWidth={3} strokeLinejoin="round" />
          <path d="M34,18 L28,30 L40,30 Z" fill="#fff" />
          <Star4 x={70} y={14} r={7} fill="#F2B233" />
        </>,
      );
    case 'easy':
      return box(
        '0 0 92 70',
        <>
          <path d="M8,54 C30,54 38,22 70,22" stroke="#3FA36B" strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M60,10 L76,22 L60,34" stroke="#3FA36B" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>,
      );
    case 'boss':
      return box(
        '-6 -16 112 120',
        <>
          <path d="M-2,22 L14,4 L86,4 L102,22 Z" fill="#CD4A31" stroke="#86281A" strokeWidth={3} />
          <rect x={6} y={22} width={88} height={70} fill="#F2EEE6" stroke="#8C7F6B" strokeWidth={3} />
          <rect x={34} y={46} width={32} height={46} rx={16} fill="#B8332A" />
          <Sun cx={50} cy={36} r={5} color="#FFD45E" />
        </>,
      );
    default:
      return box(
        '0 0 92 70',
        <>
          <circle cx={70} cy={18} r={10} fill="#FFD45E" />
          <path d="M4,48 q11,-8 21,0 t21,0 t21,0 t21,0" stroke="#2EA6BE" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M4,60 q11,-8 21,0 t21,0 t21,0 t21,0" stroke="#7FD0DC" strokeWidth={5} fill="none" strokeLinecap="round" />
        </>,
      );
  }
}
